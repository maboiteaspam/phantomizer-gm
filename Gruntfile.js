
module.exports = function(grunt) {

    var d = __dirname+"/vendors/phantomizer-gm";
    d = __dirname+"/";

    var in_dir = d+"/demo/in/";
    var out_dir = d+"/demo/out/";
    var meta_dir = d+"/demo/meta/";


    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json')

        ,"out_dir":out_dir
        ,"meta_dir":meta_dir

        //-
        ,'phantomizer-gm-merge': {
            options: {
                out_dir:out_dir
                ,meta_dir:meta_dir
                ,in_files: {
                    'img-opt.png':['img.png','img-2.png']
                }
                ,paths: [in_dir,out_dir]
            }
            ,test: {
                options:{
                    out_dir:out_dir
                    ,meta_dir:meta_dir
                    ,in_files: {
                        'img-opt2.png':['img.png','img-2.png']
                    }
                    ,paths: [in_dir,out_dir]
                }
            }
        }
    });

    grunt.registerTask('default',
        [
            'phantomizer-gm-merge:test'
        ]);
};
