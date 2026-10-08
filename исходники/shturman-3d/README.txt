3D-знак Штурман дизайн (img/shturman/mark.bin, показывает mark3d.js)

1. contour.py — в Блендере достает точный контур знака из «Shturman motion.blend» → contour.json
   /Applications/Blender.app/Contents/MacOS/Blender -b "Shturman motion.blend" --python contour.py
2. маска и поле расстояний: растеризация contour.json (2048 px, чет-нечет) → mask.npy, grid.json
   (код — в начале implicit.py не включен: маска рисуется PIL ImageDraw.polygon по каждому контуру с XOR)
3. implicit.py N — знак как тело с круглым сечением трубок, marching cubes → implicit.obj
4. solid2.py — в Блендере сглаживает и упрощает: IT=2 DR=0.0175 OUT=mark-d.bin blender -b --python solid2.py
5. enc.py mark-d.bin mark.bin 12 — сжатый формат SHM3 (дельты, порядок первого появления, побайтовые слои)
