#!/bin/sh
for img in *.gif; do
  magick "$img" "${img%.gif}.png"
done
