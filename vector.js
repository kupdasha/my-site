/* ================================================================
   КЕЙС «ВЕКТОРИЗАТОР» (поле vector у проекта)
   Главы: one — из всех функций Иллюстратора остается одна;
   zoom — растр и вектор под лупой, шторка между ними;
   steps — пять шагов трассировки на настоящем контуре кота;
   knobs — регулятор «точность кривых» меняет число точек;
   gen — промт печатается, картинка появляется и обводится.
   Картинки и SVG — настоящие ответы генератора и векторизатора:
   img/vector. Тексты — в content.js, оформление — vector.css.
   ================================================================ */
let H;   // помощники из app.js: T (типограф), pick, base

const VERS = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? Date.now() : Math.floor(Date.now() / 36e5);
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = t => t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
const wait = ms => new Promise(r => setTimeout(r, ms));

// контур кота из генератора, посчитан самим векторизатором (его функции trace/processContour):
// STAGES — картинка, уменьшенная до 38×64, чтобы были видны пиксели и лесенка; gray — тона пикселей, mask — что стало черным
const STAGES = {"W":38,"H":64,"mask":"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111000000000000000000000000000000000001111000000000000000000000000000000000001111000000000000000000000000000000000111111100000000000000000000000000000111111111100000000000000000000000000011111111111100000000000000000000000001111111111111100000000000000000000000011111111111111100000000000000000000001111111111111111000000000000000000000011111111111111111000000000000000000000111111111111111110000000000000000000001111111111111111100000000000000000000011111111111111111000000000000000000000111111111111111111000000000000000000001111111111111111110000000000000000000001111111111111111100000000000000000000000001111111111111100000000000000000000000001111111111111000000000000000000000000011111111111111000000000000000000000001111111111111110000000000000000000000011111111111111110000000000000000000001111111111111111100000000000000000000011111111111111111100000000000000000001111111111111111111100000000000000000011111111111111111111110000000000000000111111111111111111111111000000000000001111111111111111111111111000000000000011111111111111111111111111000000000000111111111111111111111111110000000000000111111111111111111111111110000000000001111111111111111111111111100000000000011111111111111111111111111100000000000011111111111111111111111111100000000000111111111111111111111111111000000000000111111111111111111111111110000000000001111111111111111111111111110000000000001111111111111111111111111100000000000011111111111111111111111111000000000000111111111111111111111111110000000000001111111111111111111111111100000000000011111111111111111111111111000000000000111111111111111111111111110000000000001111111111111111111111111100000000000011111111111111111111111111000000000000111111111111111111111111110000000000001111111111111111111111111100000000000011111111111111111111111110000000000000111111111111111111111111100000000000001111111111111111111111111000000000000011111111111111111111111110000000000000111111111111111111111111100000000000001111111111111111111111110000000000000111111111111111111111111100000000000111111111111111111111111111000000000001111111111111111111111111110000000000011111111111111111111111111100000000000111111111111111111111111110000000000001111111111111111111111111000000000000000111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000","gray":"ebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebe879c0eaebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebeb7c2c0f8de8ebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebeb5e09083b5ee4ebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebeba308080b5950e5ebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebe78f07070942235febebebebebebebebebebebebebebebebebebebebebebebebebebebebeaa528070707070858094cd5ebebebebebebebebebebebebebebebebebebebebebebebebebe96a080807070707087208071fc0ebebebebebebebebebebebebebebebebebebebebebebebeb710808070707070710780807071cd1ebebebebebebebebebebebebebebebebebebebebebebd50b0808070707070707400707070748ebebebebebebebebebebebebebebebebebebebebebebb0083646080707070707070707070708afebebebebebebebebebebebebebebebebebebebebeba8099f8a08070707070707070707070854ebebebebebebebebebebebebebebebebebebebebeb69094c1607070707070707070707070814e6ebecebebebebebebebebebebebebebebebebebc61009080707070707070707070707070707b5ebecebebebebebebebebebebebebebebebebeb9a1a080707070707070707070707070707077bebececebebebebebebebebebebebebebebebebd716282821080707070707070707070707073deaebecebebebebebebebebebebebebebebebe0b85f2b240d211207070707070707070707070bd4ebecebebebebebebebebebebebebebebe9d9dce2712d09080707070707070707070707070885ebebebebebebebebebebebebebebebebebeaeaebe9cfe3d26907070707070707070707070724e6ebebebebebebebebebebebebebebebebebebebebd6ebebd307070707070707070707070707a1ebebebebebebebebebebebebebebebebebebebebebebeb98070707070707070707070707074debebebebebebebebebebebebebebebebebebebebebebe930070707070707070707070707070cd4ebebebebebebebebebebebebebebebebebebebebeb9c07070707070707070707070707070774ebebebecebebebebebebebebebebebebebebebebe92f07070707070707070707070707070712caebebebebebebebebebebebebebebebebebebebb2080707070707070707070707070707070723b7ebebebebebebebebebebebebebebebecebeb6c0807070707070707070707070707070707070a60d5ebebebebecebebebebebebebecebebec3907070707070707070707070707070707070707071486e9ebebecebebebebebebebecebebec1f0707070707070707070707070707070707070707070748dcebebebebebebebebebebebebec1e070707070707070707070707070707070707070707070734dbebebebebebebebebebebebec3107070707070707070707070707070707070707070707070740e7ebecebebebebebebebebec580807070707070707070707070707070707070707070707070778ebebecebebebebebebebeb91090707070707070707070707070707070707070707070707070cc5ebebebebebebebebebebd60c070707070707070707070707070707070707070707070707084cebebebebebebebebebeceb4d0707070707070707070707070707070707070707070707070708c8ebebebebebebebebebebb5070707070607070707070707070707070707070707070707070770ebebebebebebebebebebec380707070707070707070815060707070707070707070707070725eaebebebebebebebebebeb9e080707070707070707094a070707070707070707070707070709c8ebebebebebebebebebebe71d0707070707070707108307070707070707070707070707070893ebebebebebebebebebebeb6b0707070707070707685d08070707070707070707070707070769ebecebebebebebebececebac07070707070707078c0e07070707070707070707070707070748ebebebebebebebebebececde0907070707070711360707070707070707070707070707070733ebebebebebebebebebebebeb2607070707070708070707070707070707070707070707070726eaebebebebebebebebebebeb4a07070707070707070707070707070707070707070707070722eaebebebebebebebebebebeb6307070707070707070707070707070707070707070707070724eaebebebebebebebebecebeb7307070707070707070707070707070707070707070707070730ebebebebebebebebecebebeb7c07070707070707070707070707070707070707070707070743ebebebebebebebebebebebeb7f0707070707070707070707070707070707070707070707075eebecebebebebebebebebebeb7f07070707070707070707070707070707070707070707070880ebecebebebebebebebebebeb78070707070707070707070707070707070707070707070708a6ebecebebebebebebebecebeb6c070707070707070707070707070707070707070707070709d1ebebebebebebebebebecebeb58070707070707070707070707070707070707070707070721eaebebebebebebebebebecebeb3c080707070707070707070707070707070707070707070851ebebebebebebebebebebebebeb1c07070707070707070707070707070707070707070707087cebebebebebebebebebebebebd9070707080807070707070707070707070707070707070707a4ebecebebebebebebebebebe9a9070707094a07070707070707070707070707070707070707c5ebebebebebebebebebe98f260b0707070d4607070707070707070707070707070707070707d2ebebebebebebebebebba282d0a070707070707070707070707070707070707070707070708cfebebebebebebebebebab11080707070707070707070707070707070707070707070707071be6ebebebebebebebebebba090707070707070707070707070707070707070707070707080a94ebebebebebebebebebebe4580c08080707070707070707070707070707070707070808209febebebebebebebebebebebebebdca8866c5b4c4137302a252221212225292f36425675a8e4ebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebebecebebebececebebebebecebebebebebebebebebebebebebebebebeb","raw":"9,3 8,3 8,4 8,5 9,5 9,6 8,6 8,7 7,7 6,7 6,8 5,8 5,9 4,9 4,10 4,11 3,11 3,12 3,13 3,14 3,15 3,16 3,17 3,18 4,18 4,19 5,19 6,19 7,19 8,19 8,20 9,20 9,21 9,22 8,22 8,23 8,24 7,24 7,25 7,26 6,26 6,27 6,28 6,29 6,30 6,31 6,32 7,32 7,33 7,34 7,35 8,35 8,36 8,37 9,37 9,38 9,39 10,39 10,40 10,41 10,42 10,43 10,44 10,45 10,46 10,47 10,48 10,49 10,50 10,51 10,52 10,53 10,54 10,55 9,55 9,56 8,56 7,56 7,57 7,58 7,59 7,60 7,61 8,61 9,61 9,62 10,62 11,62 12,62 13,62 14,62 15,62 16,62 17,62 18,62 19,62 20,62 21,62 22,62 23,62 24,62 25,62 26,62 27,62 28,62 29,62 30,62 30,61 31,61 32,61 32,60 33,60 33,59 34,59 34,58 34,57 34,56 34,55 34,54 35,54 35,53 35,52 35,51 35,50 35,49 36,49 36,48 36,47 36,46 36,45 36,44 36,43 36,42 36,41 36,40 36,39 36,38 35,38 35,37 35,36 35,35 34,35 34,34 33,34 33,33 33,32 32,32 32,31 32,30 31,30 31,29 30,29 30,28 29,28 28,28 28,27 27,27 26,27 26,26 25,26 25,25 24,25 24,24 24,23 23,23 23,22 23,21 22,21 22,20 22,19 21,19 21,18 21,17 21,16 20,16 20,15 20,14 20,13 20,12 19,12 19,11 19,10 18,10 18,9 17,9 17,8 16,8 16,7 15,7 15,6 14,6 13,6 13,5 12,5 12,4 11,4 11,3 10,3","smooth":"9.3,3.5 8.9,3.7 8.6,4.1 8.4,4.6 8.4,5.2 8.2,5.7 7.9,6.2 7.5,6.6 7,7 6.4,7.4 5.8,7.8 5.3,8.3 4.8,8.8 4.4,9.4 4.0,10.0 3.7,10.7 3.4,11.4 3.2,12.2 3.1,13.1 3.0,14.0 3.0,15.0 3.1,15.9 3.3,16.7 3.6,17.4 4,18 4.6,18.4 5.2,18.8 6,19 6.8,19.2 7.4,19.6 8.0,20.0 8.3,20.4 8.5,21.0 8.4,21.7 8.2,22.3 8,23 7.7,23.7 7.3,24.3 7,25 6.7,25.7 6.4,26.4 6.2,27.2 6.1,28.1 6.1,29 6.1,29.9 6.2,30.8 6.4,31.6 6.6,32.4 6.9,33.1 7.1,33.9 7.4,34.6 7.7,35.3 8,36 8.3,36.7 8.7,37.3 9,38 9.3,38.7 9.6,39.4 9.8,40.2 9.9,41.1 10.0,42.0 10,43 10,44 10,45 10,46 10,47 10,48 10,49 10,50 10,51 10.0,52.0 9.9,52.9 9.7,53.7 9.4,54.4 9.0,55.0 8.6,55.6 8.1,56.1 7.7,56.7 7.4,57.4 7.2,58.1 7.2,58.9 7.4,59.6 7.7,60.3 8.2,60.8 8.8,61.2 9.4,61.6 10.2,61.8 11.1,61.9 12.0,62.0 13,62 14,62 15,62 16,62 17,62 18,62 19,62 20,62 21,62 22,62 23,62 24,62 25,62 26,62 27.0,62.0 27.9,61.9 28.8,61.8 29.6,61.6 30.3,61.3 31.0,61.0 31.6,60.6 32.2,60.2 32.7,59.7 33.1,59.1 33.5,58.5 33.7,57.7 33.9,56.9 34.1,56.1 34.2,55.2 34.4,54.4 34.6,53.6 34.8,52.8 34.9,51.9 35.1,51.1 35.2,50.2 35.4,49.4 35.6,48.6 35.8,47.8 35.9,46.9 36.0,46.0 36,45 36,44 36,43 36,42 36.0,41.0 35.9,40.1 35.8,39.2 35.6,38.4 35.4,37.6 35.1,36.9 34.8,36.2 34.5,35.5 34.2,34.8 33.8,34.2 33.4,33.6 33.0,33.0 32.7,32.3 32.3,31.7 32.0,31.0 31.6,30.4 31.2,29.8 30.7,29.3 30.2,28.8 29.6,28.4 29.0,28.0 28.3,27.7 27.7,27.3 27.0,27.0 26.4,26.6 25.8,26.2 25.3,25.7 24.8,25.2 24.4,24.6 24.0,24.0 23.7,23.3 23.3,22.7 23,22 22.7,21.3 22.3,20.7 22,20 21.7,19.3 21.4,18.6 21.1,17.9 20.9,17.1 20.6,16.4 20.4,15.6 20.2,14.8 20,14 19.8,13.2 19.6,12.4 19.3,11.7 19.0,11.0 18.6,10.4 18.2,9.8 17.7,9.3 17.2,8.8 16.8,8.2 16.2,7.8 15.7,7.3 15.2,6.8 14.6,6.4 14,6 13.4,5.6 12.8,5.2 12.3,4.7 11.7,4.3 11.1,3.9 10.5,3.6 9.9,3.4","keep":"9.3,3.5 4.4,9.4 3.0,14.0 3.6,17.4 8.5,21.0 6.1,29.9 9.8,40.2 10,51 7.4,59.6 8.8,61.2 12.0,62.0 29.6,61.6 32.7,59.7 33.9,56.9 36.0,46.0 35.1,36.9 31.2,29.8 24.4,24.6 18.6,10.4 14.6,6.4","corners":"9.3,3.5 7.4,59.6","segs":[["C",9,3,7.6,6.7,3.6,8.9,3.1,13.1],["C",3.1,13.1,2.3,20.2,8.2,17.8,8.5,21.0],["C",8.5,21.0,8.7,23.7,6.1,26.2,6.1,29],["C",6.1,29,6.1,33.2,9.0,36.3,9.8,40.2],["C",9.8,40.2,10.5,44.0,10.8,50.0,9.7,53.7],["C",9.7,53.7,9.0,56.2,7.4,57.2,7,60],["C",7,60,10.5,62.6,14.8,62,19,62],["C",19,62,32.8,62,35.7,59.4,36,45],["C",36,45,36.1,39.5,34.6,31.8,29.6,28.4],["C",29.6,28.4,27.8,27.2,25.7,26.5,24.4,24.6],["C",24.4,24.6,18.9,16.3,19.6,7.1,9,3]]};
// LEVELS — тот же кот в полном размере (1024) при пяти положениях регулятора «точность кривых»
const LEVELS = [{"fit":0.3,"segs":[["L",657.5,722.1,671.3,654.1],["C",671.3,654.1,671.4,653.5,671.1,650.3,671.2,649.2],["C",671.2,649.2,671.8,643.5,672.6,637.7,672.9,631.9],["C",672.9,631.9,673.2,627.6,673,623.3,673,619],["C",673,619,673,614.4,673.2,609.7,672.9,605.1],["C",672.9,605.1,672.8,602.6,672.3,600.3,672.1,597.9],["C",672.1,597.9,670,570,661.6,543.3,648.1,518.9],["C",648.1,518.9,645.5,514.3,642.8,509.7,639.6,505.4],["C",639.6,505.4,634.4,498.6,628.8,492.3,622.8,486.2],["C",622.8,486.2,614.9,478.3,602.7,470.5,592.9,465.1],["C",592.9,465.1,588.4,462.6,583.9,460.2,579.6,457.4],["C",579.6,457.4,576,455,572.3,452.8,569.2,449.8],["C",569.2,449.8,568.3,448.8,565.2,444.8,564.6,444.4],["C",564.6,444.4,564.2,444.3,563.7,444.5,563.5,444.2],["L",563.5,444.2,521.2,326],["C",521.2,326,521,325.5,520.3,325.4,520.1,324.9],["C",520.1,324.9,519.1,323.2,518.2,321.4,517.3,319.7],["C",517.3,319.7,512,309.3,504,300.2,494.6,293.4],["C",494.6,293.4,490.3,290.4,485.4,288,481.3,284.7],["C",481.3,284.7,479.1,282.9,477.7,280.3,475.7,278.3],["C",475.7,278.3,472.7,275,469.4,271.9,466.2,268.8],["C",466.2,268.8,462.4,264.9,458.7,260.9,454.4,257.6],["C",454.4,257.6,449,253.4,444,248.4,438.1,244.9],["C",438.1,244.9,436.1,243.8,433.5,241.5,431.1,241.9],["C",431.1,241.9,427.1,242.4,428,252.2,428,255],["C",428,255,426.9,254.7,426,254.6,425,254],["C",425,254,423.6,253.3,421.1,250.5,419.4,251.2],["C",419.4,251.2,417.7,252,419.1,257.2,419.4,258.6],["C",419.4,258.6,421.2,265.8,424.2,272.6,425,280],["C",425,280,409,287.9,387.5,297.7,380.4,315.4],["C",380.4,315.4,378.7,319.6,378,324.5,378,329],["C",378,329,378,332.2,378.2,335.4,377.5,338.5],["C",377.5,338.5,376.2,344.5,372.5,350,368.9,354.9],["C",368.9,354.9,367.5,356.7,365.4,359.7,366.8,362.1],["C",366.8,362.1,367.8,363.9,371.3,363.6,373,364],["C",373,364,371.7,365.8,369.4,367.6,370.1,370],["C",370.1,370,370.5,371.2,371.1,372.2,371.3,373.4],["C",371.3,373.4,371.5,374.8,370.8,376.3,371.2,377.6],["C",371.2,377.6,371.9,379.7,375.2,380.8,376.7,382.3],["C",376.7,382.3,378.3,383.8,379.3,385.7,380.8,387.2],["C",380.8,387.2,383.4,389.7,388.1,392.1,391.6,393],["C",391.6,393,393.2,393.4,395,393.3,396.6,393.5],["C",396.6,393.5,402,394.1,407.4,394.4,412.8,395.2],["C",412.8,395.2,416.6,395.8,419.8,398,423,400],["C",423,400,428,411.2,421.4,421.4,416.1,431.1],["C",416.1,431.1,414.4,434.1,412.9,437.2,411.3,440.3],["C",411.3,440.3,405.6,451.7,401.5,464.5,400.2,477.2],["C",400.2,477.2,399.7,482.4,399.9,487.8,400,493],["C",400,493,400.1,498.8,401.3,504.8,402.6,510.4],["C",402.6,510.4,408.5,534.6,420.8,556.3,429.6,579.4],["C",429.6,579.4,435.6,595.2,438.6,612.3,439.9,629.1],["C",439.9,629.1,440.1,632.1,439.9,635,440.1,637.9],["C",440.1,637.9,440.2,641,440.9,644,441,647],["C",441,647,441.2,653.6,441.3,660.4,440.9,666.9],["C",440.9,666.9,440.8,669.7,440.2,672.3,440.1,675.1],["C",440.1,675.1,439.8,679.8,439.7,684.5,439.2,689.2],["C",439.2,689.2,438.4,697.5,437.4,705.7,436,714],["C",436,714,435,720.2,434.2,726.5,431,732],["C",431,732,420.5,732.2,407.3,736.3,405.3,748.3],["C",405.3,748.3,404.6,752.6,406.3,755.2,406.5,759.1],["C",406.5,759.1,406.7,762,405.1,765.7,406.5,768.5],["C",406.5,768.5,406.6,768.7,406.9,768.8,407,769],["C",407,769,410.5,776.7,421.2,778.8,428.8,780.2],["C",428.8,780.2,436.4,781.7,444.1,782.5,451.9,783.1],["C",451.9,783.1,454.3,783.3,456.6,783.8,459.1,783.9],["C",459.1,783.9,461.7,784.1,464.3,783.9,466.9,784.1],["C",466.9,784.1,469.7,784.2,472.3,784.8,475.1,784.9],["C",475.1,784.9,480.7,785.2,486.4,785,492,785],["C",492,785,496.4,785,500.6,786,505,786],["C",505,786,518.3,786.1,531.7,786,545,786],["C",545,786,553.6,786,562.3,786.3,571,786],["C",571,786,574,785.9,577,785.2,580.1,785.1],["C",580.1,785.1,584.4,784.8,588.7,785.1,593,785],["C",593,785,595.4,784.9,597.8,784.4,600.2,784.2],["C",600.2,784.2,605.3,783.7,610.5,783.5,615.6,782.6],["C",615.6,782.6,628.5,780,641.8,774.7,649.7,763.7],["C",649.7,763.7,652.3,760.2,654.6,755.8,655.5,751.5],["C",655.5,751.5,656.7,746.2,655.9,740.4,656,735],["C",656,735,656,732.2,656.5,729.5,656.8,726.8],["C",656.8,726.8,656.9,725.6,656.7,724.1,657,723],["C",657,723,657.1,722.7,657.4,722.4,657.5,722.1]]},{"fit":0.6,"segs":[["L",657.5,722.1,671.3,654.1],["C",671.3,654.1,671.5,652.7,671.1,650.7,671.2,649.2],["C",671.2,649.2,672.2,639.8,673,630.5,673,621],["C",673,621,673,571.2,658.6,522.1,622.8,486.2],["C",622.8,486.2,610.4,473.8,594,466.9,579.6,457.4],["C",579.6,457.4,576.4,455.3,573.1,453.3,570.3,450.7],["C",570.3,450.7,568.5,449.1,566.5,445.5,564.6,444.4],["C",564.6,444.4,564.2,444.3,563.7,444.5,563.5,444.2],["L",563.5,444.2,521.2,326],["C",521.2,326,520.9,325,518,321.1,517.3,319.7],["C",517.3,319.7,512,309.3,504,300.2,494.6,293.4],["C",494.6,293.4,490.3,290.4,485.4,288,481.3,284.7],["C",481.3,284.7,479.1,282.9,477.7,280.3,475.7,278.3],["C",475.7,278.3,469.2,271.1,462.1,263.5,454.4,257.6],["C",454.4,257.6,450.1,254.2,436.4,241.1,431.1,241.9],["C",431.1,241.9,426.7,242.5,428,252.1,428,255],["C",428,255,426.4,254.5,420.3,250.9,419.4,251.2],["C",419.4,251.2,417.4,252.1,419.1,257.2,419.4,258.6],["C",419.4,258.6,421.2,265.8,424.2,272.6,425,280],["C",425,280,408.6,288.1,387.7,297.2,380.4,315.4],["C",380.4,315.4,377.4,323,379.2,330.8,377.5,338.5],["C",377.5,338.5,375.6,347,368.7,352.3,366.7,358.6],["C",366.7,358.6,366.3,359.9,366.2,361.6,367.2,362.6],["C",367.2,362.6,368.4,363.8,371.4,363.7,373,364],["C",373,364,369.3,369.1,370.4,367.6,371.3,373.4],["C",371.3,373.4,371.5,374.8,370.8,376.3,371.2,377.6],["C",371.2,377.6,371.9,379.5,374.7,380.6,376.2,381.8],["C",376.2,381.8,381.7,386.5,383.1,390.4,390.9,392.8],["C",390.9,392.8,397.6,394.9,405.8,394.2,412.8,395.2],["C",412.8,395.2,416.6,395.8,419.8,398,423,400],["C",423,400,429.2,413.8,417.4,428.4,411.3,440.3],["C",411.3,440.3,402.8,457,399.8,474.4,400,493],["C",400,493,400.3,522.7,419.2,552.3,429.6,579.4],["C",429.6,579.4,442,612.2,442.7,654.7,439.2,689.2],["C",439.2,689.2,438,701.3,437,721.6,431,732],["C",431,732,419.8,732.2,406,737,405.1,750.1],["C",405.1,750.1,404.9,753.3,406.3,756,406.5,759.1],["C",406.5,759.1,406.8,762.6,405.8,765.6,407,769],["C",407,769,410.5,776.7,421.2,778.8,428.8,780.2],["C",428.8,780.2,449.4,784.3,471,785,492,785],["C",492,785,496.4,785,500.6,786,505,786],["C",505,786,530,786.3,555.1,786.4,580.1,785.1],["C",580.1,785.1,586.8,784.7,593.5,784.9,600.2,784.2],["C",600.2,784.2,618.2,782.4,638.3,779.6,649.7,763.7],["C",649.7,763.7,658.7,751.2,654.7,736.3,657.5,722.1]]},{"fit":1,"segs":[["L",657.5,722.1,671.3,654.1],["C",671.3,654.1,673.3,643.9,673,631.5,673,621],["C",673,621,673,571.2,658.6,522.1,622.8,486.2],["C",622.8,486.2,611.6,475.1,567.4,453.3,563.5,444.2],["L",563.5,444.2,521.2,326],["C",521.2,326,520.7,324.4,518.2,321.4,517.3,319.7],["C",517.3,319.7,508.3,301.9,495.8,296.4,481.3,284.7],["C",481.3,284.7,471.6,276.7,464.5,265.4,454.4,257.6],["C",454.4,257.6,450.1,254.2,436.4,241.1,431.1,241.9],["C",431.1,241.9,426.7,242.5,428,252.1,428,255],["C",428,255,425.6,254.3,422.2,251.1,419.9,251.2],["C",419.9,251.2,418.9,251.2,418.6,252.2,418.6,253],["C",418.6,253,418,262,424.1,271.1,425,280],["C",425,280,408.6,288.1,387.7,297.2,380.4,315.4],["C",380.4,315.4,377.4,323,379.2,330.8,377.5,338.5],["C",377.5,338.5,376.4,343.4,364.6,360,367.2,362.6],["C",367.2,362.6,368.4,363.8,371.4,363.7,373,364],["C",373,364,370,368.1,369.6,372.5,371.2,377.6],["C",371.2,377.6,372.3,380.9,387.1,391.6,390.9,392.8],["C",390.9,392.8,402.1,396.3,412.5,393.4,423,400],["C",423,400,429.2,413.8,417.4,428.4,411.3,440.3],["C",411.3,440.3,402.8,457,399.8,474.4,400,493],["C",400,493,400.3,523.5,419,551.8,429.6,579.4],["C",429.6,579.4,442.6,613.6,442.8,653.4,439.2,689.2],["C",439.2,689.2,437.9,702.6,437.9,720.1,431,732],["C",431,732,419.8,732.2,406,737,405.1,750.1],["C",405.1,750.1,404.9,753.3,406.3,756,406.5,759.1],["C",406.5,759.1,406.8,762.6,405.8,765.6,407,769],["C",407,769,410.5,776.7,421.2,778.8,428.8,780.2],["C",428.8,780.2,449.4,784.3,471,785,492,785],["C",492,785,528,785,564.3,787.8,600.2,784.2],["C",600.2,784.2,618.2,782.4,638.3,779.6,649.7,763.7],["C",649.7,763.7,658.7,751.2,654.7,736.3,657.5,722.1]]},{"fit":2,"segs":[["L",424.9,782.1,571,787.3],["C",571,787.3,572.9,787.4,578,785.1,581,785],["C",581,785,607.2,784.2,644.5,784,654.8,753.8],["C",654.8,753.8,658.2,744.1,655.5,732.2,657.5,722.1],["L",657.5,722.1,671.3,654.1],["C",671.3,654.1,682.9,596.6,664.3,527.8,622.8,486.2],["C",622.8,486.2,610.1,473.6,569.3,457.7,563.5,444.2],["L",563.5,444.2,521.2,326],["C",521.2,326,515.4,305.7,494.7,297,480.8,284.2],["C",480.8,284.2,471.7,275.8,464.3,265.3,454.4,257.6],["C",454.4,257.6,449.3,253.6,438.1,240.9,431.1,241.9],["C",431.1,241.9,426.7,242.5,428,252.1,428,255],["C",428,255,425.6,254.3,422.2,251.1,419.9,251.2],["C",419.9,251.2,418.9,251.2,418.6,252.2,418.6,253],["C",418.6,253,418,262,424.1,271.1,425,280],["C",425,280,408.1,288.4,385,298.4,379.5,318.5],["C",379.5,318.5,377.7,325.1,379,331.9,377.5,338.5],["C",377.5,338.5,375.4,347.7,359.1,361,373,364],["C",373,364,364.8,375.4,379.6,389.3,390.9,392.8],["C",390.9,392.8,402.1,396.3,412.5,393.4,423,400],["C",423,400,430.8,417.5,410.1,438.8,405.1,455.1],["C",405.1,455.1,401.2,467.8,399.9,479.8,400,493],["C",400,493,400.3,525.6,421.4,555.4,431.6,585.4],["C",431.6,585.4,441.8,615.1,440.3,646.3,440,677],["C",440,677,439.8,693.2,439.3,717.6,431,732],["C",431,732,409.3,732.5,400.3,749.3,407,769],["L",407,769,424.9,782.1]]},{"fit":4,"segs":[["L",424.9,782.1,571,787.3],["C",571,787.3,597.1,788.3,644.4,784.3,654.8,753.8],["C",654.8,753.8,658.2,744.1,655.5,732.2,657.5,722.1],["L",657.5,722.1,671.3,654.1],["C",671.3,654.1,682.9,596.6,664.3,527.8,622.8,486.2],["C",622.8,486.2,608.6,472.1,571.2,462.2,563.5,444.2],["L",563.5,444.2,521.2,326],["C",521.2,326,517.3,312.2,436.8,239.5,430.6,242],["C",430.6,242,426.7,243.5,428,251.9,428,255],["C",428,255,410.1,249.9,423.6,266.6,425,280],["C",425,280,412.5,286.2,397.6,292.4,388.3,303.3],["C",388.3,303.3,385.2,307,366.2,358.3,366.4,360.9],["C",366.4,360.9,366.7,363.9,370.8,363.5,373,364],["C",373,364,354.4,389.9,412.7,393.5,423,400],["C",423,400,429,413.4,399.8,468.9,400,493],["C",400,493,400.3,525.6,421.4,555.4,431.6,585.4],["C",431.6,585.4,441.8,615.1,440.3,646.3,440,677],["C",440,677,439.8,693.2,439.3,717.6,431,732],["C",431,732,409.3,732.5,400.3,749.3,407,769],["L",407,769,424.9,782.1]]}];

// отрезки [тип, x0, y0, …] → путь SVG
const segD = segs => 'M' + segs[0][1] + ' ' + segs[0][2] + segs.map(s =>
  s[0] === 'L' ? 'L' + s[3] + ' ' + s[4] : 'C' + s.slice(3).join(' ')).join('') + 'Z';
// ручки кривых: от опорной точки к управляющей
const segHandles = segs => segs.filter(s => s[0] === 'C').map(s =>
  `M${s[1]} ${s[2]}L${s[3]} ${s[4]}M${s[7]} ${s[8]}L${s[5]} ${s[6]}`).join('');
const plural = (n, one, few, many) => {
  const a = n % 10, b = n % 100;
  return n + ' ' + (a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 12 || b > 14) ? few : many);
};

// глава живет, только пока видна: onView(box, вкл/выкл)
function onView(box, fn, margin = '0px'){
  new IntersectionObserver(([e]) => fn(e.isIntersecting), { rootMargin: margin }).observe(box);
}
// svg-файл векторизатора → пути (fill и d), без лишнего
const svgCache = {};
function loadSVG(name){
  if (!svgCache[name]) svgCache[name] = fetch(H.base + 'img/vector/' + name + '.svg?v=' + VERS)
    .then(r => r.text())
    .then(t => [...t.matchAll(/<path[^>]*fill="([^"]+)"[^>]*\sd="([^"]+)"/g)].map(m => ({ fill: m[1], d: m[2] })))
    .catch(() => []);
  return svgCache[name];
}
// опорные точки пути: последняя пара чисел каждой команды
function anchorsOf(d){
  const out = [];
  for (const m of d.matchAll(/[MLC]([^MLCZ]+)/g)){
    const n = m[1].trim().split(/[\s,]+/).map(Number);
    out.push([n[n.length - 2], n[n.length - 1]]);
  }
  return out;
}

/* ---------- одна кнопка из всего Иллюстратора ---------- */
function oneHTML(c){
  // запятая у ключевого слова — отдельно: гаснет вместе с остальными, маркер ее не задевает
  const last = c.words.length - 1;
  return `<p class="vc-one">${c.words.map((w, i) => w === c.key
    ? `<span class="vc-key">${H.T(w)}</span>${i < last ? '<span>,</span>' : ''}`
    : `<span>${H.T(w)}${i < last ? ',' : ''}</span>`).join(' ')}</p>`;
}
function liveOne(box){
  const root = box.querySelector('.vc-one');
  const words = [...root.querySelectorAll('span:not(.vc-key)')];
  let on = false, run = 0;
  async function loop(id){
    while (on && id === run){
      root.classList.remove('hit'); words.forEach(w => w.classList.remove('off'));
      await wait(1600); if (id !== run) return;
      // гаснут по одной в случайном порядке, остается трассировка
      const order = words.slice().sort(() => Math.random() - .5);
      for (const w of order){ w.classList.add('off'); await wait(2200 / order.length); if (id !== run) return; }
      root.classList.add('hit');
      await wait(4200);
    }
  }
  if (still()){ words.forEach(w => w.classList.add('off')); root.classList.add('hit'); return; }
  onView(root, v => { on = v; if (v) loop(++run); else run++; });
}

/* ---------- растр и вектор под лупой ---------- */
function zoomHTML(c){
  return `<div class="vc-zoom" style="--x:50%">
    <canvas class="vc-raster" aria-hidden="true"></canvas>
    <svg class="vc-vec" aria-hidden="true"></svg>
    <canvas class="vc-dots" aria-hidden="true"></canvas>
    <span class="vc-split"><i></i></span>
    <span class="vc-tag vc-tag-l">${H.T(c.left)}</span><span class="vc-tag vc-tag-r">${H.T(c.right)}</span>
    <span class="vc-scale"></span>
  </div>${c.caption ? `<p class="vc-cap">${H.T(c.caption)}</p>` : ''}`;
}
async function liveZoom(box, c){
  const el = box.querySelector('.vc-zoom');
  const cv = el.querySelector('.vc-raster'), ctx = cv.getContext('2d');
  const dv = el.querySelector('.vc-dots'), dtx = dv.getContext('2d');
  const svg = el.querySelector('.vc-vec'), scaleEl = el.querySelector('.vc-scale');
  const img = new Image(); img.src = H.base + 'img/vector/' + c.image + '?v=' + VERS;
  const paths = await loadSVG(c.svg);
  svg.innerHTML = paths.map(p => `<path fill="${p.fill}" d="${p.d}"/>`).join('');
  const pts = paths.flatMap(p => anchorsOf(p.d));
  try { await img.decode(); } catch (e) { return; }
  const N = img.naturalWidth, F = c.focus || [N / 2, N / 2], MAX = c.max || 10;
  let W = 0, Hh = 0, dpr = 1, split = .5, touched = false, t0 = 0, raf = 0, on = false, s = 1;

  function size(){
    const r = el.getBoundingClientRect(); dpr = Math.min(devicePixelRatio || 1, 2);
    W = r.width; Hh = r.height;
    for (const k of [cv, dv]){ k.width = Math.round(W * dpr); k.height = Math.round(Hh * dpr); }
    draw();
  }
  function draw(){
    if (!W) return;
    // окно просмотра в координатах картинки: по высоте — N/s, центр едет к детали
    const k = (s - 1) / (MAX - 1), vh = N / s, vw = vh * W / Hh;
    const cx = N / 2 + (F[0] - N / 2) * k, cy = N / 2 + (F[1] - N / 2) * k;
    const x0 = cx - vw / 2, y0 = cy - vh / 2, px = W / vw;   // px — экранных точек в пикселе картинки
    svg.setAttribute('viewBox', `${x0} ${y0} ${vw} ${vh}`);
    // растр — без сглаживания, как он есть: пиксели видно квадратами
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.imageSmoothingEnabled = false;
    const sx = Math.max(0, x0), sy = Math.max(0, y0), ex = Math.min(N, x0 + vw), ey = Math.min(N, y0 + vh);
    if (ex > sx && ey > sy)
      ctx.drawImage(img, sx, sy, ex - sx, ey - sy, (sx - x0) * px * dpr, (sy - y0) * px * dpr, (ex - sx) * px * dpr, (ey - sy) * px * dpr);
    // опорные точки на векторе — проявляются при увеличении
    dtx.setTransform(dpr, 0, 0, dpr, 0, 0); dtx.clearRect(0, 0, W, Hh);
    const a = clamp((s - 2.2) / 2, 0, 1);
    if (a > 0){
      dtx.globalAlpha = a; dtx.lineWidth = 1.5; dtx.strokeStyle = '#1D222A'; dtx.fillStyle = '#fff';
      for (const p of pts){
        const x = (p[0] - x0) * px, y = (p[1] - y0) * px;
        if (x < -8 || y < -8 || x > W + 8 || y > Hh + 8) continue;
        dtx.fillRect(x - 4, y - 4, 8, 8); dtx.strokeRect(x - 4, y - 4, 8, 8);
      }
      dtx.globalAlpha = 1;
    }
    el.style.setProperty('--x', (split * 100).toFixed(2) + '%');
    scaleEl.textContent = '×' + (Math.round(s * 10) / 10).toString().replace('.', ',');
  }
  function tick(t){
    raf = 0;
    if (!t0) t0 = t;
    // цикл 11 с: держим целиком, плавно въезжаем в деталь, держим, выезжаем
    const T = ((t - t0) / 1000) % 11;
    const u = T < 2 ? 0 : T < 5 ? ease((T - 2) / 3) : T < 8 ? 1 : T < 10.5 ? 1 - ease((T - 8) / 2.5) : 0;
    s = 1 + (MAX - 1) * u;
    if (!touched) split = .5 + .16 * Math.sin((t - t0) / 1400);
    draw();
    if (on) raf = requestAnimationFrame(tick);
  }
  const move = e => {
    const r = el.getBoundingClientRect();
    split = clamp((e.clientX - r.left) / r.width, .04, .96); touched = true; if (!on || still()) draw();
  };
  el.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' || e.buttons) move(e); });
  el.addEventListener('pointerdown', e => { move(e); });
  new ResizeObserver(size).observe(el);
  if (still()){ s = MAX * .5; draw(); return; }
  onView(el, v => { on = v; if (v && !raf) raf = requestAnimationFrame(tick); });
}

/* ---------- пять шагов трассировки ---------- */
function stepsHTML(c){
  const { W, H: Hp, mask, gray } = STAGES;
  // пиксели: тон из картинки, после шага «цвета» — черный или белый
  let px = '';
  for (let y = 0; y < Hp; y++) for (let x = 0; x < W; x++){
    const i = y * W + x, g = parseInt(gray.substr(i * 2, 2), 16), m = mask[i] === '1';
    if (g > 236 && !m) continue;   // чистый фон не рисуем
    px += `<rect x="${x + .06}" y="${y + .06}" width=".88" height=".88" class="${m ? 'm1' : 'm0'}" style="--g:rgb(${g},${g},${g});--d:${((x + y) * 9) | 0}ms"/>`;
  }
  // мусор: несколько случайных крошек вокруг — их уберет второй шаг
  const specks = [[2, 40], [33, 8], [30, 14], [1, 58], [24, 4], [35, 30]].map(([x, y]) =>
    `<rect x="${x + .06}" y="${y + .06}" width=".88" height=".88"/>`).join('');
  const dots = (s, cls, r) => s.split(' ').map(p => { const [x, y] = p.split(','); return cls === 'sq'
    ? `<rect x="${x - r}" y="${y - r}" width="${r * 2}" height="${r * 2}"/>` : `<circle cx="${x}" cy="${y}" r="${r}"/>`; }).join('');
  const final = segD(STAGES.segs);
  return `<div class="vc-steps" style="--n:${c.items.length}">
    <div class="vc-stage">
      <svg viewBox="-3 -2 44 68" aria-hidden="true">
        <g class="vc-px">${px}</g>
        <g class="vc-sp">${specks}</g>
        <path class="vc-raw" pathLength="1" d="M${STAGES.raw}Z"/>
        <path class="vc-sm" d="M${STAGES.smooth}Z"/>
        <g class="vc-keep">${dots(STAGES.keep, 'c', .55)}</g>
        <g class="vc-cor">${dots(STAGES.corners, 'sq', .8)}</g>
        <path class="vc-fin" pathLength="1" d="${final}"/>
        <path class="vc-hd" d="${segHandles(STAGES.segs)}"/>
        <g class="vc-anc">${dots(STAGES.segs.map(s => s[1] + ',' + s[2]).join(' '), 'sq', .6)}</g>
      </svg>
    </div>
    <ol class="vc-list">${c.items.map((it, i) => `<li><button class="vc-step" data-i="${i}">
      <b>${H.T(it.title)}</b><span>${H.T(it.text)}</span><i></i></button></li>`).join('')}</ol>
  </div>`;
}
function liveSteps(box, c){
  const root = box.querySelector('.vc-steps'), btns = [...root.querySelectorAll('.vc-step')];
  const n = btns.length, DUR = 3400;
  let cur = -1, timer = 0, on = false, held = false;
  let reset = 0;
  function go(i){
    cur = (i + n) % n;
    clearTimeout(reset);
    if (cur === 0 && !still()){
      // новый круг: всё мгновенно гаснет, полсекунды видны серые пиксели, потом цвета сводятся
      root.classList.add('vc-reset');
      for (let k = 0; k < n; k++) root.classList.remove('s' + k);
      void root.offsetWidth;
      reset = setTimeout(() => { root.classList.remove('vc-reset'); root.classList.add('s0'); }, 700);
    } else for (let k = 0; k < n; k++) root.classList.toggle('s' + k, k <= cur);
    btns.forEach((b, k) => b.classList.toggle('on', k === cur));
    root.style.setProperty('--dur', DUR + 'ms');
    clearTimeout(timer);
    if (on && !held && !still()) timer = setTimeout(() => go(cur + 1), cur === n - 1 ? DUR + 1400 : DUR);
  }
  btns.forEach((b, i) => b.addEventListener('click', () => { held = true; root.classList.add('held'); go(i); }));
  go(still() ? n - 1 : 0);
  onView(root, v => { on = v; if (v) go(held ? cur : cur); else clearTimeout(timer); }, '-10% 0px');
}

/* ---------- регулятор «точность кривых» ---------- */
function knobsHTML(c){
  return `<div class="vc-knobs">
    <div class="vc-cat"><svg viewBox="${c.view || '334 211 368 604'}" aria-hidden="true">
      <path class="vc-cat-fill"/><path class="vc-cat-hd"/><g class="vc-cat-pts"></g></svg></div>
    <div class="vc-panel">
      <label class="vc-row"><span>${H.T(c.label)}</span><b class="vc-val"></b></label>
      <input class="vc-range" type="range" min="0" max="${LEVELS.length - 1}" step="1" value="2" aria-label="${H.T(c.label)}">
      <p class="vc-count"></p>
      ${c.text ? `<p class="vc-note">${H.T(c.text)}</p>` : ''}
    </div>
  </div>`;
}
function liveKnobs(box, c){
  const root = box.querySelector('.vc-knobs'), range = root.querySelector('.vc-range');
  const fill = root.querySelector('.vc-cat-fill'), hd = root.querySelector('.vc-cat-hd'), g = root.querySelector('.vc-cat-pts');
  const val = root.querySelector('.vc-val'), count = root.querySelector('.vc-count');
  const words = H.pick(c.points) || ['точка', 'точки', 'точек'];
  function show(i){
    const L = LEVELS[i];
    fill.setAttribute('d', segD(L.segs)); hd.setAttribute('d', segHandles(L.segs));
    g.innerHTML = L.segs.map((s, k) => `<rect x="${s[1] - 5}" y="${s[2] - 5}" width="10" height="10" style="--d:${k * 6}ms"/>`).join('');
    val.textContent = L.fit.toFixed(1).replace('.', ',');
    count.textContent = plural(L.segs.length, ...words);
    range.value = i; range.style.setProperty('--p', (i / (LEVELS.length - 1) * 100) + '%');
  }
  // сам ходит туда-обратно, пока не тронули
  let dir = 1, timer = 0, touched = false, on = false;
  const step = () => {
    let i = +range.value + dir;
    if (i < 0 || i >= LEVELS.length){ dir = -dir; i = +range.value + dir; }
    show(i);
    timer = setTimeout(step, 1500);
  };
  range.addEventListener('input', () => { touched = true; clearTimeout(timer); show(+range.value); });
  show(2);
  if (!still()) onView(root, v => { on = v; clearTimeout(timer); if (v && !touched) timer = setTimeout(step, 1200); });
}

/* ---------- генерация: промт → картинка → вектор ---------- */
function genHTML(c){
  return `<div class="vc-gen">
    <div class="vc-prompt">
      <div class="vc-modes">${c.modes.map((m, i) => `<span class="vc-mode" data-m="${i}">${H.T(m)}</span>`).join('')}</div>
      <p class="vc-line"><span class="vc-typed"></span><i class="vc-caret"></i><span class="vc-suffix"></span></p>
      ${c.note ? `<p class="vc-note">${H.T(c.note)}</p>` : ''}
    </div>
    <div class="vc-art">
      <img class="vc-img" alt="">
      <svg class="vc-out" viewBox="0 0 1024 1024" aria-hidden="true"></svg>
      <span class="vc-tag vc-tag-l vc-phase"></span>
    </div>
  </div>`;
}
function liveGen(box, c){
  const root = box.querySelector('.vc-gen');
  const typed = root.querySelector('.vc-typed'), suffix = root.querySelector('.vc-suffix');
  const img = root.querySelector('.vc-img'), out = root.querySelector('.vc-out'), phase = root.querySelector('.vc-phase');
  const modes = [...root.querySelectorAll('.vc-mode')];
  let on = false, run = 0, k = 0;
  // картинки и векторы грузим заранее — пока печатается промт, всё уже готово
  const items = c.items.map(it => ({ ...it, svg: loadSVG(it.name),
    img: new Promise(res => { const im = new Image(); im.onload = im.onerror = () => res(im); im.src = H.base + 'img/vector/' + it.name + '.webp?v=' + VERS; }) }));
  async function show(it, id){
    const alive = () => on && id === run;
    root.className = 'vc-gen'; typed.textContent = ''; suffix.textContent = ''; out.innerHTML = '';
    modes.forEach((m, i) => m.classList.toggle('on', i === it.mode));
    phase.innerHTML = H.T(c.phases[0]);
    for (const ch of it.prompt){ typed.textContent += ch; await wait(55 + Math.random() * 40); if (!alive()) return; }
    await wait(350); if (!alive()) return;
    suffix.textContent = ', ' + c.suffix[0] + ', ' + c.suffix[1 + it.mode];
    root.classList.add('sent');
    await wait(1100); if (!alive()) return;
    img.src = (await it.img).src; root.classList.add('pic');
    await wait(1500); if (!alive()) return;
    const paths = await it.svg;
    out.innerHTML = paths.map((p, i) => `<path pathLength="1" d="${p.d}" style="--f:${p.fill};--i:${i}"/>`).join('');
    phase.innerHTML = H.T(c.phases[1]);
    root.classList.add('trace');
    await wait(1800); if (!alive()) return;
    root.classList.add('vec');
    await wait(3200);
  }
  async function loop(id){
    while (on && id === run){ await show(items[k], id); if (id !== run) return; k = (k + 1) % items.length; }
  }
  if (still()){
    const it = items[0];
    typed.textContent = it.prompt; suffix.textContent = ', ' + c.suffix[0] + ', ' + c.suffix[1 + it.mode];
    modes.forEach((m, i) => m.classList.toggle('on', i === it.mode));
    it.svg.then(ps => { out.innerHTML = ps.map(p => `<path d="${p.d}" style="--f:${p.fill}"/>`).join(''); root.classList.add('sent', 'trace', 'vec'); });
    phase.innerHTML = H.T(c.phases[1]);
    return;
  }
  onView(root, v => { on = v; if (v) loop(++run); else run++; }, '-10% 0px');
}

const KINDS = {
  one:   [oneHTML, liveOne],
  zoom:  [zoomHTML, liveZoom],
  steps: [stepsHTML, liveSteps],
  knobs: [knobsHTML, liveKnobs],
  gen:   [genHTML, liveGen],
};

const head = ch => `<div class="vc-head">
  <span class="case-label vc-label">${H.T(ch.label)}</span>
  <h2 class="vc-title">${H.T(ch.title)}</h2>
  ${ch.text ? `<p class="vc-text">${H.T(ch.text)}</p>` : ''}
</div>`;

/* ---------- запуск ---------- */
let cssReady;
function loadCSS(base){
  if (!cssReady) cssReady = new Promise(res => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = base + 'vector.css?v=' + VERS;
    l.onload = l.onerror = res; document.body.appendChild(l);   // в конец body: стили кейса идут после style.css
  });
  return cssReady;
}
const reveal = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); }
}), { rootMargin: '0px 0px -12% 0px' });

export async function mountVector(mount, p, helpers){
  H = helpers;
  await loadCSS(H.base);
  if (!mount.isConnected) return;   // кейс успели закрыть
  const ch = p.vector.chapters || [];
  const kinds = ch.map(c => Object.keys(KINDS).find(k => c[k]));
  mount.innerHTML = ch.map((c, i) =>
    `<section class="vc-ch wrap vc-${kinds[i]}-ch">${head(c)}<div class="vc-viz">${kinds[i] ? KINDS[kinds[i]][0](c[kinds[i]]) : ''}</div></section>`).join('')
    // демо — крупная лаймовая кнопка в конце, в обеих версиях
    + (p.vector.demo ? `<section class="vc-ch wrap vc-try"><a class="btn vc-demo" href="${p.vector.demo.link}" target="_blank" rel="noopener">${H.T(p.vector.demo.text)}<span class="arr" aria-hidden="true">↗</span></a></section>` : '');
  mount.querySelectorAll('.vc-ch').forEach(s => reveal.observe(s));
  mount.querySelectorAll('.vc-ch').forEach((s, i) => { const k = kinds[i]; if (k) KINDS[k][1](s.querySelector('.vc-viz'), ch[i][k]); });
}
