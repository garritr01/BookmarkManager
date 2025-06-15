mkdir -p extension/icons
convert -size 128x128 canvas:"#4285f4" extension/icons/128.png
convert extension/icons/128.png -resize 48x48 extension/icons/48.png
convert extension/icons/128.png -resize 32x32 extension/icons/32.png
convert extension/icons/128.png -resize 16x16 extension/icons/16.png
