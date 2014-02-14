'use strict';

module.exports = function(grunt) {

    var path = require('path')
    var gm = require('gm')
    var ph_libutil = require("phantomizer-libutil");

    grunt.registerMultiTask("phantomizer-gm-merge", "Merge many pictures within a unique file", function () {
        var file_utils = ph_libutil.file_utils;

        var options = this.options({
            in_files:{},
            out_dir:"",
            anti_alias:true,
            paths:[]
        });
        var in_files    = options.in_files;
        var out_dir     = options.out_dir;
        var paths       = options.paths;
        var anti_alias  = options.anti_alias;


// get phantomizer main instance
      var phantomizer = ph_libutil.get("main");
      var meta_manager = phantomizer.get_meta_manager();

        var gm = require('gm').subClass({ imageMagick: true });

        var gm_forge = function(anti_alias){
            return function(src){
                return gm(src).antialias(anti_alias);
            }
        }(anti_alias);

        var current_grunt_task = this.nameArgs;
        var current_grunt_opt = this.options();
        var user_config = grunt.config();

        var g_queue = queue_async()
        var pos_map = {}

        for( var tgt_file in in_files ){

            var meta_file = tgt_file+"";

            // check if a cache entry exists, if it is fresh, just serve it
            if( meta_manager.is_fresh(meta_file) == false ){
                g_queue.add();

                var a_tgt_file = out_dir+tgt_file;
                var src_files = in_files[ tgt_file ];
                var handle = null;
                // gm("img.png").append("another.jpg").append("third.gif")

                var a_tgt_dir = path.dirname(a_tgt_file);
                if( grunt.file.exists( a_tgt_dir ) == false )
                    grunt.file.mkdir( a_tgt_dir );

                var img_queue = queue_async();
                pos_map[a_tgt_file] = {};
                for( var n in src_files ){
                    var src_file = src_files[n];
                    var tgt_pos = src_file.match(/^(left-to-right:)/)==null?"top-to-bottom":"left-to-right";
                    src_file = src_file.replace(tgt_pos+":","");
                    var a_src_file = file_utils.find_file(paths, src_file);
                    pos_map[a_tgt_file][a_src_file] = {
                        tgt_pos:tgt_pos
                        ,width:0
                        ,height:0
                        ,x:0
                        ,y:0
                    }
                }

                for( var a_src_file in pos_map[a_tgt_file] ){
                    img_queue.add();
                    (function(gm, a_tgt_file, a_src_file, img_queue){
                        gm(a_src_file).size(function(err, value){
                            if( ! value ){
                                grunt.log.error("Wrong file detected "+src_file);
                            }
                            pos_map[a_tgt_file][a_src_file].width = value.width;
                            pos_map[a_tgt_file][a_src_file].height = value.height;
                            img_queue.rem();
                        })
                    })(gm_forge, a_tgt_file, a_src_file, img_queue);
                }

                img_queue.then((function(a_tgt_file, meta_file){
                    return function(){
                        if( grunt.file.exists(a_tgt_file) )
                            grunt.file.delete(a_tgt_file);

                        var handle = gm_forge("").background('transparent')
                        for( var a_src_file in pos_map[a_tgt_file] ){
                            handle.append(a_src_file /*, tgt_pos == "left-to-right" */)
                        }

                        handle.write(a_tgt_file, function (err) {
                            if (err){
                                grunt.log.error(err)
                                done(false)
                            }

                            var entry = meta_manager.create([]);
                            entry.add_dependency(__filename);

                            var cur_h = 0

                            grunt.log.ok("File created "+ a_tgt_file)
                            grunt.log.writeln("-------------------------")
                            for( var a_src_file in pos_map[a_tgt_file] ){
                                grunt.log.writeln(a_src_file)
                                entry.add_dependency(a_src_file);
                                pos_map[a_tgt_file][a_src_file].y = cur_h
                                cur_h += pos_map[a_tgt_file][a_src_file].height
                            }

                            entry.add_dependency( process.cwd()+"/Gruntfile.js");
                            entry.add_dependency( user_config.project_dir+"/../config.json");
                            entry.require_task(current_grunt_task, current_grunt_opt);
                            entry.extras["map"] = pos_map[a_tgt_file];
                            entry.save(meta_file);

                            g_queue.rem();
                        });
                    }
                })(a_tgt_file, meta_file))

            }else{
                grunt.log.ok("the build is fresh\n\t" + meta_file)
            }
        }


        var done = this.async()
        g_queue.then(function(){
            grunt.log.ok("Done")
            done()
        })
    });


    function queue_async (){
        var queue = function(){
            this._count = 0
            this._cb = null
            this._call = function(){
                if( this._count == 0 && this._cb != null )
                    this._cb()
            }
            this.add = function(){
                this._count++
            }
            this.rem = function(){
                this._count--
                this._call()
            }
            this.then = function( cb ){
                this._cb = cb
                this._call()
            }
        }
        return new queue()
    }

};


