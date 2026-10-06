/* ================================================================
   Кейс «Новый век»: история ребрендинга.
   Собирает блоки из NDA.novyiVek.brand (тексты — в ../nda.js)
   и NV_LOGO (векторы логотипов из брендбука), анимирует по прокрутке.
   ================================================================ */
function nvCase(){
  var B = NDA.novyiVek.brand, T = NDA.novyiVek, L = window.NV_LOGO;
  var clamp = function(v,a,b){ return Math.max(a, Math.min(b, v)); };
  var seg = function(p,a,b){ return clamp((p-a)/(b-a), 0, 1); };
  var ease = function(t){ return 1 - Math.pow(1-t, 3); };
  var inout = function(t){ return t<.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2; };
  var mix = function(a,b,t){ return a + (b-a)*t; };
  var $ = function(s,r){ return (r||document).querySelector(s); };
  var $$ = function(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
  function hex(c){ return [parseInt(c.slice(1,3),16), parseInt(c.slice(3,5),16), parseInt(c.slice(5,7),16)]; }
  function mixColor(a,b,t){ var A=hex(a), C=hex(b); return 'rgb('+A.map(function(v,i){ return Math.round(mix(v,C[i],t)); }).join(',')+')'; }
  var RED = '#A3001A', OLDRED = '#D8101C', INK = '#1D222A', PALE = '#E6E8EB';
  var flowerPaths = function(cls, fill){ return L.new.flower.map(function(d,i){ return '<path class="'+cls+' '+cls+i+'" d="'+d+'" fill="'+fill+'"/>'; }).join(''); };

  /* ================= первый экран: знак собирается из двух частей и становится серебряным ================= */
  $('#hero').innerHTML =
    '<section class="hero-scene bleed"><div class="sticky">'+
      '<div class="hs-mark"><div class="hs-tilt">'+
        '<img class="hs-chrome" src="case/chrome-mark.webp" alt="Серебряный знак банка «Новый век»">'+
        '<i class="hs-blik"></i>'+
        '<svg class="hs-vec" viewBox="-6 -6 232 227">'+L.new.flower.map(function(d,i){ return '<path class="hv hv'+i+'" d="'+d+'"/>'; }).join('')+'</svg>'+
      '</div><i class="hs-shadow"></i></div>'+
      '<div class="hs-text"><h1 data-t="title"></h1><p class="hs-sub">'+B.heroSub+'</p><div class="tags"></div></div>'+
    '</div></section>';

  /* ================= история ================= */
  var h = [];
  h.push('<section class="cs"><h2 data-rv>'+B.briefTitle+'</h2><div class="brief-list">'+
    B.brief.map(function(t){ return '<p data-rv>'+t+'</p>'; }).join('')+'</div>'+
    '<div class="banned"><h3 data-rv>'+B.bannedTitle+'</h3><ul>'+B.banned.map(function(t){ return '<li data-strike>'+t+'</li>'; }).join('')+'</ul></div></section>');

  h.push('<section class="cs"><h2 data-rv>'+B.compTitle+'</h2><img class="wide" data-rv src="case/competitors.webp" alt="Логотипы банков-конкурентов">'+
    '<ul class="comp-list">'+B.comp.map(function(t){ return '<li data-rv>'+t+'</li>'; }).join('')+'</ul></section>');

  /* логотип: одна сцена — было → стало, монограмма Н + В, горизонтальная → вертикальная */
  var oldLetters = L.old.letters.map(function(l){ return '<path class="ol'+(l.dash?' dash':'')+'" d="'+l.d+'" fill="'+INK+'"/>'; }).join('');
  var morph = L.old.flower.map(function(d){ return '<path class="of" d="'+d+'" fill="'+OLDRED+'"/>'; }).join('') +
              L.old.flower.map(function(d){ return '<path class="mf" d="'+d+'" fill="'+OLDRED+'" opacity="0"/>'; }).join('');
  var trueF = L.new.flower.map(function(d,i){ return '<path class="nf nf'+i+'" d="'+d+'" fill="'+RED+'" opacity="0"/>'; }).join('');
  var newLetters = L.new.bank.concat(L.new.name).map(function(l){ return '<path class="nl" d="'+l.d+'" fill="'+INK+'" opacity="0"/>'; }).join('');
  h.push('<section class="scene logo-scene"><div class="sticky"><div class="label"><h2>'+B.logoTitle+'</h2></div>'+
    '<div class="stage"><svg class="ls-svg" viewBox="-20 -20 1051 260" preserveAspectRatio="xMidYMid meet"><g class="flower">'+morph+trueF+'</g>'+oldLetters+newLetters+'</svg>'+
    '<div class="mono-letters"><span class="ml ml-n">Н</span><span class="ml ml-v">В</span><span class="ml ml-j">'+B.monoJoin+'</span></div></div>'+
    '<div class="ls-cap"><span class="c-was">'+B.logoWas+'</span><span class="c-now">'+B.logoNow+'</span><span class="c-mono">'+B.monoText+'</span><span class="c-lock">'+B.lockText+'</span></div></div></section>');
  h.push('<figure class="big"><img data-rv src="case/phone.webp" alt="Иконка приложения на экране телефона"></figure>');

  /* шрифт */
  h.push('<section class="cs font-cs"><h2 data-rv>'+B.fontTitle+'</h2><div class="font-name">'+B.fontName+'</div>'+
    '<p class="font-sample">'+B.fontText.split(' ').map(function(w){ return '<span>'+w+'</span>'; }).join(' ')+'</p>'+
    '<p class="font-rule" data-rv>'+B.fontRule+'</p></section>');

  /* палитра */
  h.push('<section class="cs"><h2 data-rv>'+B.paletteTitle+'</h2><div class="bars">'+
    B.palette.map(function(c){ var dark = c.hex==='#25292C' || c.hex==='#A3001A'; return '<div class="bar'+(dark?' dark':'')+'" data-grow="'+c.grow+'" style="background:'+c.hex+';--g:'+c.grow+'" title="скопировать"><span>'+c.hex+'</span></div>'; }).join('')+
    '</div><div class="extra"><div><h3 data-rv>'+B.extraTitle+'</h3><p class="mute" data-rv>'+B.extraText+'</p><div class="xcards">'+
    B.extra.map(function(x){ return '<div class="xcard" data-rv><div class="t" style="background:'+x.top+'">'+x.name+'</div><div class="b" style="background:'+x.bottom+'">'+B.extraMore+'<i>→</i></div></div>'; }).join('')+
    '</div></div><svg class="donut" viewBox="-130 -130 260 260"></svg></div><p class="note">'+B.extraNote+'</p></section>');

  /* дух — коллаж как на слайде */
  var tiles = [['spirit-top',.833,1.389,98.333,56.157],['spirit-1',.833,58.519,32.422,40.231],['spirit-2',33.802,58.519,32.396,40.231],['spirit-3',66.771,58.519,32.396,40.231]];
  h.push('<section class="cs"><div class="collage spirit">'+tiles.map(function(t,i){
    return '<figure class="tile" style="left:'+t[1]+'%;top:'+t[2]+'%;width:'+t[3]+'%;height:'+t[4]+'%;--d:'+(i*0.12)+'s"><img src="case/'+t[0]+'.webp" alt=""></figure>'; }).join('')+
    '</div><p class="txt mute" data-rv>'+B.spiritText+'</p></section>');

  /* стиль верстки — коллаж как на слайде */
  var blocks = [['layout-a',3.646,21.481,'left'],['layout-b',41.354,6.481,'right'],['layout-c',60.208,57.407,'up']];
  h.push('<section class="cs"><h2 data-rv>'+B.layoutTitle+'</h2><div class="collage layout"><img class="base" src="case/layout-base.webp" alt="">'+
    blocks.map(function(b,i){ return '<figure class="blk from-'+b[3]+'" style="left:'+b[1]+'%;top:'+b[2]+'%;--d:'+(i*0.18)+'s"><img src="case/'+b[0]+'.webp" alt=""></figure>'; }).join('')+'</div><p class="txt m-only">'+B.layoutText+'</p></section>');

  /* карты */
  h.push('<section class="cs"><h2 data-rv>'+B.cardTitle+'</h2><div class="card-stage"><div class="card3d"><div class="tilt">'+
    B.cards.map(function(c,i){ return '<div class="face '+(i?'face-back':'face-front')+'"><img src="'+c.img+'" alt="Карта: '+c.label+'"><i class="glare"></i></div>'; }).join('')+
    '</div></div></div><div class="card-switch">'+B.cards.map(function(c,i){ return '<button'+(i?'':' class="on"')+'>'+c.label+'</button>'; }).join('')+'</div>'+
    '<p class="card-text">'+B.cards[0].text+'</p></section>');
  h.push('<div class="hand bleed"><img src="case/hand.webp" alt="Карта в руке"></div>');

  /* банкомат — живой экран */
  var icons = {
    put:  '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 9h20M15 14h4M17 12v4"/>',
    take: '<rect x="2" y="3" width="20" height="18" rx="2"/><path d="M15 9l-6 6M9 10v5h5"/>',
    pay:  '<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 13a3 3 0 1 1 3 4" /><path d="M19 3l1 3"/>',
    hist: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h2M12 16h2M16 16h0"/>',
    info: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 11h5"/><circle cx="10" cy="16" r="2.4"/><path d="M12 18l2 2"/>',
    doc:  '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 16l2-3 2 2 2-4"/>'
  };
  var tilesA = [['put','положить','внести наличные'],['take','снять','валютно-обменные операции'],['pay','оплатить','ЖКХ, налоги, интернет'],['hist','история<br>операций',''],['info','информация<br>и сервис',''],['doc','запросить<br>выписку','']];
  var menu = ['новости','о банке','частным клиентам','корпоративным клиентам','финансовым организациям','партнеры','социальные программы Банка','информация ЦБ РФ','борьба с мошенничеством'];
  h.push('<section class="cs atm-cs"><h2 data-rv>'+B.atmTitle+'</h2><p class="txt" data-rv>'+B.atmText+'</p>'+
    '<div class="atm-device"><div class="atm-screen"><div class="ui">'+
      '<div class="u-head"><span class="u-logo"><svg viewBox="0 0 220 215">'+L.new.flower.map(function(d){ return '<path d="'+d+'" fill="'+RED+'"/>'; }).join('')+'</svg>новый век</span><span class="u-search">⌕ поиск</span></div>'+
      '<div class="u-side"><i class="u-pill"></i>'+menu.map(function(m){ return '<span>'+m+'</span>'; }).join('')+'</div>'+
      '<div class="u-title">'+'банк креативных индустрий'.split(' ').map(function(w){ return '<span>'+w+'</span>'; }).join(' ')+'</div>'+
      '<div class="u-tiles">'+tilesA.map(function(t){ return '<div class="u-tile"><svg viewBox="0 0 24 24">'+icons[t[0]]+'</svg><b>'+t[1]+'</b>'+(t[2]?'<small>'+t[2]+'</small>':'')+'</div>'; }).join('')+'</div>'+
      '<div class="u-rates"><div class="r-h"><span></span><b>покупка</b><b>продажа</b><b>ЦБ РФ</b></div>'+
        '<div class="r-row"><em>USD*</em><span data-v="83.90">0</span><span data-v="85.80">0</span><span data-v="84.8379">0</span></div>'+
        '<div class="r-row"><em>EUR*</em><span data-v="96.55">0</span><span data-v="98.75">0</span><span data-v="96.9155">0</span></div>'+
        '<div class="r-row r-sum"><em>до 999</em><span class="r-wide">от 1 000 до 9 999</span><span>от 10 000</span></div></div>'+
      '<div class="u-phones"><b>+7 985 456 73 23</b><small>по вопросам работы банкомата</small><b>+7 983 765 78 21</b><small>телефон Банка</small></div>'+
      '<i class="u-touch"></i>'+
    '</div></div></div></section>');

  /* приложение */
  h.push('<section class="cs"><h2 data-rv>'+B.appTitle+'</h2><p class="txt" data-rv>'+B.appText+'</p>'+
    '<div class="shine" data-rv><img src="case/chrome-mark.webp" alt=""><i></i></div>'+
    '<figure class="big"><img data-rv src="case/app.webp" alt="Экраны приложения"></figure></section>');

  $('#brand').innerHTML = h.join('');
  var sh = $('.site-head'); if(sh){ sh.querySelector('h2').textContent = B.siteTitle; sh.querySelector('p').textContent = B.siteText; }

  /* ================= появление ================= */
  var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }); }, {threshold:.2});
  $$('[data-rv],[data-strike],.collage,.atm-device').forEach(function(el){ io.observe(el); });
  $$('[data-strike]').forEach(function(el,i){ el.style.transitionDelay = (i*0.08)+'s'; });
  var bars = $('.bars');
  new IntersectionObserver(function(es,o){ if(es[0].isIntersecting){ bars.classList.add('in'); $$('.bar',bars).forEach(function(b,i){ setTimeout(function(){ b.style.flexGrow = b.dataset.grow; }, i*140); }); o.disconnect(); } }, {threshold:.3}).observe(bars);
  $$('.bar').forEach(function(b){ b.addEventListener('click', function(){ var s=b.querySelector('span'), t=s.textContent; try{ navigator.clipboard.writeText(t); }catch(e){} s.textContent='скопировано'; setTimeout(function(){ s.textContent=t; }, 1100); }); });

  /* бублик */
  var donut = $('.donut'), total = B.extra.reduce(function(s,x){ return s+x.value; }, 0), a0 = -Math.PI/2, NS = 'http://www.w3.org/2000/svg';
  var arcs = B.extra.map(function(x){
    var a1 = a0 + x.value/total*Math.PI*2, gap = .03, R = 82;
    var p = document.createElementNS(NS,'path');
    p.setAttribute('d','M '+(Math.cos(a0+gap)*R)+' '+(Math.sin(a0+gap)*R)+' A '+R+' '+R+' 0 '+((a1-a0)>Math.PI?1:0)+' 1 '+(Math.cos(a1-gap)*R)+' '+(Math.sin(a1-gap)*R));
    p.setAttribute('fill','none'); p.setAttribute('stroke',x.bottom); p.setAttribute('stroke-width','58');
    donut.appendChild(p);
    var mid = (a0+a1)/2, g = document.createElementNS(NS,'g'); g.setAttribute('transform','translate('+(Math.cos(mid)*118)+' '+(Math.sin(mid)*118)+')');
    g.innerHTML = '<rect x="-38" y="-17" width="76" height="34" rx="17" fill="'+x.top+'"/><text text-anchor="middle" y="5" fill="#1D222A">0</text>';
    donut.appendChild(g);
    var len = p.getTotalLength(); p.style.strokeDasharray = len; p.style.strokeDashoffset = len; g.style.opacity = 0; g.style.transition = 'opacity .5s';
    a0 = a1; return {p:p, t:g.querySelector('text'), v:x.value, g:g};
  });
  new IntersectionObserver(function(es,o){ if(!es[0].isIntersecting) return; o.disconnect();
    arcs.forEach(function(a,i){ setTimeout(function(){
      a.p.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)'; a.p.style.strokeDashoffset = 0; a.g.style.opacity = 1;
      var t0 = performance.now(); (function f(now){ var k = clamp((now-t0)/1100,0,1); a.t.textContent = (a.v*ease(k)).toFixed(1).replace('.',',')+' млн'; if(k<1) requestAnimationFrame(f); })(t0);
    }, i*280); });
  }, {threshold:.4}).observe(donut);

  /* карты */
  var card = $('.card3d'), tilt = $('.card3d .tilt'), stage = $('.card-stage');
  stage.addEventListener('mousemove', function(e){ var r = card.getBoundingClientRect(), x = (e.clientX-r.left)/r.width, y = (e.clientY-r.top)/r.height;
    tilt.style.transform = 'rotateY('+((x-.5)*16)+'deg) rotateX('+((.5-y)*12)+'deg)';
    $$('.glare',card).forEach(function(g){ g.style.setProperty('--gx',(x*100)+'%'); g.style.setProperty('--gy',(y*100)+'%'); }); });
  stage.addEventListener('mouseleave', function(){ tilt.style.transform = ''; });
  var sw = $$('.card-switch button'), ctext = $('.card-text');
  function showCard(i){ card.classList.toggle('flip', i===1); sw.forEach(function(b,j){ b.classList.toggle('on', j===i); });
    ctext.style.opacity = 0; setTimeout(function(){ ctext.textContent = B.cards[i].text; ctext.style.opacity = 1; }, 300); }
  sw.forEach(function(b,i){ b.addEventListener('click', function(){ showCard(i); }); });
  stage.addEventListener('click', function(){ showCard(card.classList.contains('flip') ? 0 : 1); });

  /* ================= первый экран: заставка ================= */
  var hero = $('.hero-scene'), hshadow = $('.hs-shadow'), hvs = $$('.hv'), hmark = $('.hs-mark'), htilt = $('.hs-tilt'), htext = $('.hs-text');
  hvs.forEach(function(p,i){ var len = p.getTotalLength(); p.style.strokeDasharray = len; p.style.strokeDashoffset = len;
    p.style.transform = i ? 'translate(70px,-60px) rotate(24deg)' : 'translate(-70px,60px) rotate(-24deg)'; });
  requestAnimationFrame(function(){ requestAnimationFrame(function(){ hero.classList.add('play'); }); });
  setTimeout(function(){ hero.classList.add('lit'); }, 2300);   /* серебро и блик */
  hero.addEventListener('mousemove', function(e){ var r = hero.getBoundingClientRect(), x = (e.clientX-r.left)/r.width-.5, y = (e.clientY-r.top)/innerHeight-.5;
    htilt.style.transform = 'rotateY('+(x*22)+'deg) rotateX('+(-y*16)+'deg)'; htilt.style.setProperty('--bx', (50+x*80)+'%'); });
  hero.addEventListener('mouseleave', function(){ htilt.style.transform = ''; });

  /* ================= банкомат: экран включается, плитки собираются, палец нажимает ================= */
  var dev = $('.atm-device'), ui = $('.atm-device .ui'), pill = $('.u-pill'), sideItems = $$('.u-side span'), uTiles = $$('.u-tile'), touch = $('.u-touch'), rateCells = $$('.u-rates [data-v]');
  function placePill(i){ var s = sideItems[i]; pill.style.top = s.offsetTop+'px'; pill.style.height = s.offsetHeight+'px'; sideItems.forEach(function(x,j){ x.classList.toggle('on', j===i); }); }
  function rollRates(jitter){ rateCells.forEach(function(c){ var v = +c.dataset.v, d = c.dataset.v.split('.')[1].length, from = jitter ? v - .4 : (+c.textContent || 0), t0 = performance.now();
    (function f(now){ var k = clamp((now-t0)/900,0,1); c.textContent = (from+(v-from)*ease(k)).toFixed(d); if(k<1) requestAnimationFrame(f); })(t0); }); }
  var atmStarted = false;
  new IntersectionObserver(function(es){ if(!es[0].isIntersecting || atmStarted) return; atmStarted = true;
    setTimeout(function(){ placePill(1); }, 50);
    setTimeout(function(){ rollRates(false); }, 1700);
    var steps = [[2,1],[4,2],[0,3],[5,4]], k = 0;
    setTimeout(function loop(){
      var st = steps[k++ % steps.length], tile = uTiles[st[0]];
      var grid = tile.parentNode; touch.style.left = (grid.offsetLeft + tile.offsetLeft + tile.offsetWidth*.55)+'px'; touch.style.top = (grid.offsetTop + tile.offsetTop + tile.offsetHeight*.5)+'px';
      touch.classList.remove('tap'); void touch.offsetWidth; touch.classList.add('tap');
      setTimeout(function(){ tile.classList.add('press'); }, 380);
      setTimeout(function(){ tile.classList.remove('press'); placePill(st[1]); }, 900);
      if(k % 2 === 0) setTimeout(function(){ rollRates(true); }, 1200);
      setTimeout(loop, 2600);
    }, 3200);
  }, {threshold:.35}).observe(dev);

  /* ================= сцены по прокрутке ================= */
  var scenes = [], TOP = 76;
  function scene(el, type, fn){ if(el) scenes.push({el:el, type:type, fn:fn, last:-1}); }

  scene(hero, 'sticky', function(p){
    var z = inout(seg(p,.05,.6)), fly = Math.pow(seg(p,.45,1), 2.2);
    var dx = innerWidth <= 760 ? 0 : -16;
    hmark.style.transform = 'translate('+(-z*dx*-1)+'vw,'+(z*-4 + fly*6)+'vh) scale('+(mix(1,2.6,z) * (1 + fly*7))+') rotate('+(z*-8 - fly*10)+'deg)';
    hmark.style.filter = fly > .01 ? 'blur('+(fly*28).toFixed(1)+'px)' : '';
    hmark.style.opacity = 1 - seg(p,.78,1);
    hshadow.style.opacity = hero.classList.contains('lit') ? 1 - seg(p,.02,.25) : '';
    htext.style.transform = 'translateY('+(-seg(p,0,.5)*120)+'px)'; htext.style.opacity = 1 - seg(p,.05,.4);
  });

  /* логотип */
  var ls = $('.logo-scene'), flower = $('.logo-scene .flower'), ols = $$('.ol'), ofs = $$('.of'), mfs = $$('.mf'), nfs = $$('.nf'), nls = $$('.nl'), interps = null;
  function ring(d){ var parts = d.split(/(?=M )/).filter(function(s){ return s.trim().length > 20; }), best = parts[0], area = 0;
    parts.forEach(function(s){ var n = s.match(/-?\d+\.?\d*/g).map(Number), xs = n.filter(function(v,i){ return !(i%2); }), ys = n.filter(function(v,i){ return i%2; });
      var a = (Math.max.apply(0,xs)-Math.min.apply(0,xs))*(Math.max.apply(0,ys)-Math.min.apply(0,ys)); if(a > area){ area = a; best = s; } });
    return best; }
  function center(d){ var n = d.match(/-?\d+\.?\d*/g).map(Number), x=0, y=0, k=0; for(var i=0;i<n.length-1;i+=2){ x+=n[i]; y+=n[i+1]; k++; } return [x/k, y/k]; }
  if(window.flubber){ try{
    var newR = L.new.flower.map(ring), newC = L.new.flower.map(center);
    interps = L.old.flower.map(function(d){ var c = center(d), best = 0, bd = 1e9;
      newC.forEach(function(nc,i){ var dd = Math.hypot(nc[0]-c[0], nc[1]-c[1]); if(dd < bd){ bd = dd; best = i; } });
      return flubber.interpolate(ring(d), newR[best], {maxSegmentLength: 3}); });
  }catch(e){ interps = null; } }
  ols.forEach(function(el){ el.style.transformBox = 'fill-box'; el.style.transformOrigin = '50% 100%'; });
  flower.style.transformBox = 'fill-box'; flower.style.transformOrigin = '50% 50%';
  var nN = $('.nf1'), nV = $('.nf0'), mlN = $('.ml-n'), mlV = $('.ml-v'), mlJ = $('.ml-j'), lsvg = $('.ls-svg'), caps = $$('.ls-cap span');
  var letters = L.new.bank.concat(L.new.name), S = .78, bankTop = 175, nameTop = 252, vekTop = nameTop + 79*S + 16;
  var targets = letters.map(function(l,i){
    if(i < 4) return {s:1, x:l.x-275.8, y:bankTop + (l.y-7.7)};
    var jj = i-4, base = jj < 5 ? 278.6 : 772.4, top = jj < 5 ? nameTop : vekTop;
    return {s:S, x:(l.x-base)*S, y:top + (l.y-110)*S};
  });
  var VB_H = [-20,-20,1051,260], VB_M = [-60,-40,700,295], VB_V = [-30,-24,400,430];
  function vbMix(A,Bv,t){ return A.map(function(v,i){ return mix(v,Bv[i],t); }); }
  var crisp = function(v){ return ease(clamp((v-.35)/.3,0,1)); };
  scene(ls, 'sticky', function(P){
    /* часть 1: было → стало */
    var p = seg(P,0,.34);
    var fall = seg(p,.12,.42);
    ols.forEach(function(el,i){ var dash = el.classList.contains('dash'), t = ease(seg(fall, i*.018, .55+i*.018));
      el.style.transform = dash ? 'translateX('+(-t*260)+'px)' : 'translateY('+(t*140)+'px) rotate('+((i%2?1:-1)*t*24)+'deg)'; el.style.opacity = 1-t; });
    var k = inout(seg(p,.2,.56));
    if(interps) mfs.forEach(function(el,i){ el.setAttribute('d', interps[i](k)); });
    var c = mixColor(OLDRED, RED, k), swap = seg(p,.2,.25);
    /* до начала перехода видны настоящие контуры старого символа — с просветами в лепестках */
    ofs.forEach(function(el){ el.setAttribute('fill', c); el.style.opacity = interps ? 1-swap : 1-k; });
    mfs.forEach(function(el){ el.setAttribute('fill', c); el.style.opacity = interps ? Math.min(swap, 1-seg(p,.5,.58)) : 0; });
    nfs.forEach(function(el){ el.setAttribute('opacity', interps ? seg(p,.48,.56) : k); });

    /* часть 2: монограмма — надпись уходит, знак крупнее, части по очереди дают «Н» и «В» */
    var q = seg(P,.36,.64), zoomIn = inout(seg(q,0,.18));
    var a = seg(q,.15,.35), b = seg(q,.45,.62), jn = seg(q,.72,.88);
    var nOn = a*(1-b), vOn = b*(1-jn);
    nN.setAttribute('fill', mixColor(PALE, RED, crisp(Math.max(nOn, jn, 1-a))));
    nV.setAttribute('fill', mixColor(PALE, RED, crisp(Math.max(vOn, jn, 1-a))));
    nN.style.transform = 'translate('+(nOn*14)+'px,'+(-nOn*14)+'px)';
    nV.style.transform = 'translate('+(-vOn*12)+'px,'+(vOn*12)+'px)';
    mlN.classList.toggle('on', nOn > .5); mlV.classList.toggle('on', vOn > .5); mlJ.classList.toggle('on', jn > .5 && P < .66);

    /* часть 3: надпись возвращается и перестраивается в вертикальную версию */
    var r = seg(P,.66,1), back = inout(seg(r,0,.2)), vert = inout(seg(r,.4,.75));
    var lettersOn = Math.min(1 - seg(q,0,.15), 1) + seg(r,.05,.25);
    letters.forEach(function(l,i){ var Tg = targets[i], s = mix(1,Tg.s,vert);
      var rise = (1 - ease(seg(p,.56+i*.016,.7+i*.016)))*70;
      nls[i].setAttribute('transform','translate('+mix(0, Tg.x - Tg.s*l.x, vert)+' '+(mix(0, Tg.y - Tg.s*l.y, vert) + rise)+') scale('+s+')');
      nls[i].style.transform = '';
      nls[i].setAttribute('opacity', Math.min(ease(seg(p,.56+i*.016,.7+i*.016)), clamp(lettersOn,0,1))); });
    var fs = 1 - .3*vert;
    flower.style.transform = 'translate('+(-33*vert)+'px,'+(-32.25*vert)+'px) rotate('+(-40*(1-k))+'deg) scale('+(mix(.86,1,k)*fs)+')';
    var vb = P < .66 ? vbMix(VB_H, VB_M, zoomIn) : (vert > 0 ? vbMix(VB_H, VB_V, vert) : vbMix(VB_M, VB_H, back));
    lsvg.setAttribute('viewBox', vb.join(' '));

    /* подписи */
    var cap = P < .17 ? 0 : P < .36 ? 1 : P < .66 ? 2 : 3;
    caps.forEach(function(s,i){ s.classList.toggle('on', i === cap); });
  });

  /* шрифт */
  var fcs = $('.font-cs'), fname = $('.font-name'), words = $$('.font-sample span');
  scene(fcs, 'pass', function(p){
    fname.style.fontVariationSettings = '"wght" '+Math.round(mix(200,700,seg(p,.1,.55)));
    var k = seg(p,.3,.7)*words.length; words.forEach(function(w,i){ w.classList.toggle('on', i < k); });
  });

  /* бриф: строки серые и по очереди наливаются черным, пока их прокручивают */
  /* бриф: черным горит одна строка — та, до которой дошла прокрутка; остальные серые */
  var bl = $('.brief-list'), bls = $$('.brief-list p');
  scene(bl, 'pass', function(p){
    var mid = innerHeight*.5, k = -1, best = innerHeight*.35;
    bls.forEach(function(el,i){ var r = el.getBoundingClientRect(), d = Math.abs(r.top + r.height/2 - mid); if(d < best){ best = d; k = i; } });
    bls.forEach(function(el,i){ el.classList.toggle('on', i === k); });
  });

  /* коллажи: картинки внутри плиток чуть плывут */
  $$('.collage.layout .blk').forEach(function(b,i){ scene(b, 'pass', function(p){ b.style.setProperty('--py', ((.5-p)*[30,-24,40][i])+'px'); }); });
  var hand = $('.hand'); scene(hand, 'pass', function(p){ hand.firstChild.style.transform = 'scale('+mix(1.15,1,p)+')'; });
  scene(dev, 'pass', function(p){ dev.style.setProperty('--s', mix(.9,1,ease(seg(p,.05,.5)))); });

  function tick(){
    var vh = innerHeight;
    scenes.forEach(function(s){
      var r = s.el.getBoundingClientRect(), p;
      if(s.type === 'sticky') p = clamp((TOP - r.top)/Math.max(1, s.el.offsetHeight - (vh - TOP)), 0, 1);
      else p = clamp((vh - r.top)/(vh + r.height), 0, 1);
      if(Math.abs(p - s.last) < .0005) return;
      s.last = p; s.fn(p);
    });
  }
  var raf = 0;
  addEventListener('scroll', function(){ if(!raf) raf = requestAnimationFrame(function(){ raf = 0; tick(); }); }, {passive:true});
  addEventListener('resize', tick);
  tick();
}
