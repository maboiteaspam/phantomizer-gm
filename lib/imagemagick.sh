#!/bin/sh

IM_HOME="/home/clement/Bureau/go-fsteps/grunt2/project/vendors/ImageMagick-6.8.6-0.i386/"

export MAGICK_HOME="$HOME/ImageMagick-6.8.6"
export PATH="$MAGICK_HOME/bin:$PATH"

nargs=$#
args=
while [ $nargs -gt 1 ]
do
  args="\"\$$nargs\" $args"
  nargs=`expr $nargs - 1`
done

# for debug
## echo "$1 $args"


eval exec $1 $args