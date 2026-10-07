(function(){
  // 5.9.1 — bloqueio global de zoom para preservar composição e hit-areas no mobile.
  // Single-touch continua livre para scroll, sliders e Parallax; somente gestos de zoom são interceptados.
  function isMobilePointer(){
    try{return matchMedia('(pointer:coarse)').matches || navigator.maxTouchPoints>0}catch(_error){return navigator.maxTouchPoints>0}
  }
  ['gesturestart','gesturechange','gestureend'].forEach(function(type){
    document.addEventListener(type,function(event){if(isMobilePointer())event.preventDefault()},{passive:false});
  });
  document.addEventListener('touchmove',function(event){
    if(isMobilePointer() && event.touches && event.touches.length>1)event.preventDefault();
  },{passive:false});
  document.addEventListener('dblclick',function(event){
    if(isMobilePointer())event.preventDefault();
  },{passive:false});
  const CTA_SELECTOR = [
    '[data-design-role="cta"]',
    '.button-primary','.btn-primary','.opp-cta','.svp-hero-button','.formsenderCSS_button','.spp-cta','.pit-glass-cta','.pp-flip-cta','.btn-flip','.btn-flipFake',
    '.fsp-result a[data-fsp-cta]',
    'a[class*="__cta"]','button[class*="__cta"]','a[class*="-cta"]','button[class*="-cta"]','a[class*="_cta"]','button[class*="_cta"]',
    'a[class*="call-to-action"]','button[class*="call-to-action"]'
  ].join(',');
  function buttonEffect(){return cssVar(document.documentElement,'--action-button-effect','depth')||'depth'}
  function buttonClickEffect(){return cssVar(document.documentElement,'--action-button-click-effect','press')||'press'}
  function decorateCTA(el){
    if(!(el instanceof Element))return;
    el.classList.add('imobify-design-cta');
    el.dataset.imobifyEffect=buttonEffect();
  }
  function parseColor(value){
    const raw=String(value||'').trim();
    let m=raw.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if(m){let hex=m[1];if(hex.length===3)hex=hex.split('').map(c=>c+c).join('');return {r:parseInt(hex.slice(0,2),16),g:parseInt(hex.slice(2,4),16),b:parseInt(hex.slice(4,6),16)}}
    m=raw.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
    if(m)return {r:+m[1],g:+m[2],b:+m[3]};
    return null;
  }
  function hex(rgb){const h=v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0');return '#'+h(rgb.r)+h(rgb.g)+h(rgb.b)}
  function lum(value){const rgb=parseColor(value);if(!rgb)return null;const c=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};return c(rgb.r)*.2126+c(rgb.g)*.7152+c(rgb.b)*.0722}
  function ratio(a,b){const x=lum(a),y=lum(b);if(x==null||y==null)return 1;return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
  function mix(a,b,t){const x=parseColor(a),y=parseColor(b);if(!x||!y)return a;t=Math.max(0,Math.min(1,Number(t)||0));return hex({r:x.r+(y.r-x.r)*t,g:x.g+(y.g-x.g)*t,b:x.b+(y.b-x.b)*t})}
  function safest(background){return ratio('#ffffff',background)>=ratio('#000000',background)?'#ffffff':'#000000'}
  function ensureContrast(preferred,background,minimum){
    minimum=Number(minimum)||4.5;
    if(!parseColor(preferred)||!parseColor(background)||ratio(preferred,background)>=minimum)return preferred;
    const target=safest(background);
    for(let step=1;step<=20;step++){const candidate=mix(preferred,target,step/20);if(ratio(candidate,background)>=minimum)return candidate}
    return target;
  }
  function cssVar(el,name,fallback=''){return (getComputedStyle(el).getPropertyValue(name)||fallback).trim()}
  function contrastEnabled(){return cssVar(document.documentElement,'--contrast-enabled','1')!=='0'}
  function contrastMinimum(){return Number(cssVar(document.documentElement,'--contrast-min','4.5'))||4.5}
  function setSafe(el,name,preferred,background){if(!el||!contrastEnabled())return;el.style.setProperty(name,ensureContrast(preferred,background,contrastMinimum()))}
  function applyDesignSemantics(root){
    const scope=root&&root.querySelectorAll?root:document;
    const pluginRoots=[];
    if(scope instanceof Element){
      const owner=scope.closest('[data-plugin]');
      if(owner)pluginRoots.push(owner);
    }
    if(scope.querySelectorAll)scope.querySelectorAll('[data-plugin]').forEach(el=>pluginRoots.push(el));
    [...new Set(pluginRoots)].forEach(function(plugin){
      plugin.querySelectorAll('h1,h2,h3,h4,h5,h6,[data-design-role=\"title\"]').forEach(function(el){
        el.classList.add('imobify-design-title');
      });
      plugin.querySelectorAll('.hero-copy,.svp-hero-subtitle,[class$=\"__subtitle\"],[class$=\"-subtitle\"],[class$=\"_subtitle\"],[class$=\"__subheading\"],[class$=\"-subheading\"],[class$=\"_subheading\"],[data-design-role=\"subtitle\"]').forEach(function(el){
        el.classList.add('imobify-design-subtitle');
      });
      plugin.querySelectorAll('h1,h2').forEach(function(heading){
        const next=heading.nextElementSibling;
        if(next&&next.matches('p:not(.eyebrow):not(.legal)'))next.classList.add('imobify-design-subtitle');
      });
      plugin.querySelectorAll(CTA_SELECTOR).forEach(decorateCTA);
      plugin.querySelectorAll('.bbp[data-project-profile=\"true\"] .bbp__cta').forEach(decorateCTA);
    });
  }

  function applyContrastGuards(root){
    if(!contrastEnabled())return;
    const scope=root&&root.querySelectorAll?root:document;
    const include=(selector)=>{const out=[];if(scope instanceof Element&&scope.matches(selector))out.push(scope);scope.querySelectorAll(selector).forEach(el=>out.push(el));return out};

    include('.pit-section').forEach(el=>{
      const accent=cssVar(el,'--pit-accent',cssVar(document.documentElement,'--primary','#16a34a'));
      const surface=cssVar(document.documentElement,'--surface','#ffffff');
      setSafe(el,'--pit-accent-on-surface',accent,surface);
      setSafe(el,'--pit-accent-contrast',safest(accent),accent);
    });

    include('.iwfp-widget').forEach(el=>{
      const bg=cssVar(el,'--iwfp-bg','#25d366');
      setSafe(el,'--iwfp-icon-safe',cssVar(el,'--iwfp-icon','#ffffff'),bg);
      setSafe(el,'--iwfp-text-safe',cssVar(el,'--iwfp-text','#ffffff'),bg);
    });

    include('.imobify-menu-pro').forEach(el=>{
      const text=cssVar(el,'--imp-text','#ffffff'),accent=cssVar(el,'--imp-accent','#d4af37');
      const bg=cssVar(el,'--imp-bg','#0a1628'),scroll=cssVar(el,'--imp-bg-scroll',bg),mobile=cssVar(el,'--imp-mobile-bg',bg);
      setSafe(el,'--imp-text-safe',text,bg);setSafe(el,'--imp-text-scroll-safe',text,scroll);setSafe(el,'--imp-text-mobile-safe',text,mobile);
      setSafe(el,'--imp-accent-safe',accent,bg);setSafe(el,'--imp-accent-scroll-safe',accent,scroll);setSafe(el,'--imp-accent-mobile-safe',accent,mobile);
      setSafe(el,'--imp-accent-contrast',safest(accent),accent);
    });
  }

  function clearButtonMotion(el){if(!el)return;el.style.removeProperty('--imobify-button-x');el.style.removeProperty('--imobify-button-y')}
  document.addEventListener('pointermove',function(event){
    const el=event.target.closest?.('.imobify-design-cta');
    if(!el||buttonEffect()!=='magnetic'||matchMedia('(prefers-reduced-motion: reduce)').matches||!matchMedia('(pointer:fine)').matches)return;
    const rect=el.getBoundingClientRect();
    if(!rect.width||!rect.height)return;
    const x=((event.clientX-rect.left)/rect.width-.5)*10;
    const y=((event.clientY-rect.top)/rect.height-.5)*8;
    el.style.setProperty('--imobify-button-x',x.toFixed(2)+'px');
    el.style.setProperty('--imobify-button-y',y.toFixed(2)+'px');
  },{passive:true});
  document.addEventListener('pointerout',function(event){
    const el=event.target.closest?.('.imobify-design-cta');
    if(el&&!el.contains(event.relatedTarget))clearButtonMotion(el);
  },{passive:true});
  document.addEventListener('click',function(event){
    const el=event.target.closest?.('.imobify-design-cta');
    if(!el||el.matches('[disabled],[aria-disabled="true"]'))return;
    const mode=buttonClickEffect();
    if(mode==='ripple'){
      const rect=el.getBoundingClientRect();
      const ripple=document.createElement('span');
      ripple.className='imobify-button-ripple';
      const restorePosition=getComputedStyle(el).position==='static';
      if(restorePosition)el.style.position='relative';
      el.classList.add('imobify-ripple-active');
      const cx=Number.isFinite(event.clientX)&&event.clientX!==0?event.clientX-rect.left:rect.width/2;
      const cy=Number.isFinite(event.clientY)&&event.clientY!==0?event.clientY-rect.top:rect.height/2;
      ripple.style.left=cx+'px'; ripple.style.top=cy+'px';
      el.appendChild(ripple);setTimeout(()=>{ripple.remove();el.classList.remove('imobify-ripple-active');if(restorePosition)el.style.removeProperty('position')},650);
    }else if(mode==='bounce'||mode==='flash'){
      const cls=mode==='bounce'?'imobify-button-click-bounce':'imobify-button-click-flash';
      el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);setTimeout(()=>el.classList.remove(cls),430);
    }
  });

  document.addEventListener('click',function(event){
    if(event.__imobifyFloatingHandled)return;
    const link=event.target.closest?.('[href^="#"]');
    if(!link)return;
    const href=String(link.getAttribute('href')||'').trim();
    if(!href||href==='#')return;
    const floating=window.ImobifyFloating?.get?.(href);
    if(floating){
      event.preventDefault();
      window.ImobifyFloating.open(href,link);
      return;
    }
    let target=null;
    try{target=document.querySelector(href)}catch(_error){return}
    if(target){event.preventDefault();target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}
  });
  window.Imobify={
    track:function(name,data){
      window.dataLayer=window.dataLayer||[];
      window.dataLayer.push({event:name,...(data||{})});
    },
    contrastRatio:ratio,
    ensureContrast:ensureContrast,
    applyContrastGuards:applyContrastGuards,
    applyDesignSemantics:applyDesignSemantics,
    registerCTA:function(el){decorateCTA(el);return el},
    refreshDesign:function(root){applyDesignSemantics(root||document);applyContrastGuards(root||document)}
  };
  const scan=()=>{applyDesignSemantics(document);applyContrastGuards(document)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scan);else scan();
  new MutationObserver(function(mutations){
    mutations.forEach(function(mutation){mutation.addedNodes.forEach(function(node){if(node instanceof Element){applyDesignSemantics(node);applyContrastGuards(node)}})});
  }).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','data-design-role']});
})();


(function(){const hero=document.querySelector('[data-plugin="hero"]');if(!hero)return;hero.querySelectorAll('.button').forEach(button=>button.addEventListener('click',()=>window.Imobify&&Imobify.track('hero_cta',{label:button.textContent.trim()})));})();


(function () {
  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function safeHref(value) {
    var raw = String(value || '').trim();
    if (/^#[A-Za-z][\w:.-]*$/.test(raw)) return raw;
    if (/^(?:\/|\.\/|\.\.\/)(?!\/)/.test(raw)) return raw;
    if (/^(?:https?:|mailto:|tel:)/i.test(raw)) return raw;
    return '#';
  }

  function safeImage(value) {
    var raw = String(value || '').trim();
    if (/^data:image\/(?:avif|gif|jpeg|png|svg\+xml|webp);/i.test(raw)) return raw;
    if (/^(?:https?:)?\/\//i.test(raw)) return raw;
    if (/^(?:\/|\.\/|\.\.\/)(?!\/)/.test(raw)) return raw;
    if (/^[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.~%+@()-]+)+(?:\?[A-Za-z0-9_.~!$&'()*+,;=:@%/?-]*)?$/.test(raw)) return raw;
    return '';
  }

  function normalizeSlide(item, index) {
    item = item && typeof item === 'object' ? item : {};
    return {
      id: String(item.id || ('slide-' + (index + 1))),
      image: String(item.image || ''),
      imageAlt: String(item.imageAlt || item.title || ''),
      eyebrow: String(item.eyebrow || ''),
      title: String(item.title || ''),
      text: String(item.text || item.copy || ''),
      showButton: item.showButton !== false && String(item.showButton).toLowerCase() !== 'false',
      buttonText: String(item.buttonText || item.cta || ''),
      buttonLink: String(item.buttonLink || item.link || '#')
    };
  }

  function legacySlides(slider) {
    var items = [];
    for (var n = 1; n <= 3; n += 1) {
      var image = slider.dataset['image' + n] || '';
      var title = slider.dataset['title' + n] || '';
      var eyebrow = slider.dataset['eyebrow' + n] || '';
      var text = slider.dataset['copy' + n] || '';
      var cta = slider.dataset['cta' + n] || '';
      var link = slider.dataset['link' + n] || '#';
      if (!image && !title && !eyebrow && !text && !cta) continue;
      items.push(normalizeSlide({ id:'slide-' + n, image:image, imageAlt:title, eyebrow:eyebrow, title:title, text:text, showButton:Boolean(cta), buttonText:cta, buttonLink:link }, items.length));
    }
    return items;
  }

  function readSlides(slider) {
    try {
      var parsed = JSON.parse(slider.dataset.slides || '[]');
      if (Array.isArray(parsed) && parsed.length) return parsed.map(normalizeSlide);
    } catch (_) {}
    return legacySlides(slider);
  }

  function slideMarkup(item, index) {
    var image = safeImage(item.image);
    var button = item.showButton && item.buttonText.trim()
      ? '<a class="button button-primary" href="' + esc(safeHref(item.buttonLink)) + '">' + esc(item.buttonText) + '</a>'
      : '';
    var eyebrow = item.eyebrow.trim() ? '<p class="eyebrow">' + esc(item.eyebrow) + '</p>' : '';
    var title = item.title.trim() ? '<h2>' + esc(item.title) + '</h2>' : '';
    var text = item.text.trim() ? '<p>' + esc(item.text) + '</p>' : '';
    var img = image ? '<img src="' + esc(image) + '" alt="' + esc(item.imageAlt || item.title) + '"' + (index ? ' loading="lazy"' : '') + ' decoding="async">' : '';
    return '<article class="property-slide' + (index === 0 ? ' is-active' : '') + '" data-slide-index="' + index + '" aria-hidden="' + (index === 0 ? 'false' : 'true') + '">' + img + '<div class="property-slide-shade"></div><div class="property-slide-content">' + eyebrow + title + text + button + '</div></article>';
  }

  function renderSlides(slider) {
    var items = readSlides(slider);
    var track = slider.querySelector('.property-slider-track');
    var dots = slider.querySelector('.property-slider-dots');
    if (track) track.innerHTML = items.map(slideMarkup).join('');
    if (dots) dots.innerHTML = items.map(function (_, index) {
      return '<button type="button" data-slider-dot="' + index + '" class="' + (index === 0 ? 'is-active' : '') + '" aria-label="Ir para slide ' + (index + 1) + '" aria-selected="' + (index === 0 ? 'true' : 'false') + '"></button>';
    }).join('');
    slider.dataset.slideCount = String(items.length);
  }

  function init(root) {
    if (root.dataset.sliderReady === 'true') return;
    root.dataset.sliderReady = 'true';
    var slider = root.matches('.property-slider') ? root : (root.querySelector(':scope > .property-slider') || root);
    renderSlides(slider);
    var slides = Array.from(slider.querySelectorAll('.property-slide'));
    var dots = Array.from(slider.querySelectorAll('[data-slider-dot]'));
    var index = 0;
    var timer = 0;
    var interval = Math.max(2500, Number(slider.dataset.interval) || 5500);
    var autoplay = slider.dataset.autoplay === 'true' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var pauseOnHover = slider.dataset.pauseHover !== 'false';
    var loop = slider.dataset.loop !== 'false';
    var swipe = slider.dataset.swipe !== 'false';
    var startX = null;
    slider.style.setProperty('--slider-duration', interval + 'ms');

    function show(next, userAction) {
      if (!slides.length) return;
      if (loop) index = (next + slides.length) % slides.length;
      else index = Math.max(0, Math.min(slides.length - 1, next));
      slides.forEach(function (slide, position) {
        var active = position === index;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', active ? 'false' : 'true');
      });
      dots.forEach(function (dot, position) {
        dot.classList.toggle('is-active', position === index);
        dot.setAttribute('aria-selected', position === index ? 'true' : 'false');
      });
      if (userAction) restart();
    }

    function schedule() {
      window.clearTimeout(timer);
      slider.classList.remove('is-running');
      if (!autoplay || slides.length < 2 || document.hidden) return;
      void slider.offsetWidth;
      slider.classList.add('is-running');
      timer = window.setTimeout(function () {
        if (!loop && index >= slides.length - 1) { slider.classList.remove('is-running'); return; }
        show(index + 1); schedule();
      }, interval);
    }

    function restart() { schedule(); }
    slider.querySelector('[data-slider-prev]')?.addEventListener('click', function () { show(index - 1, true); });
    slider.querySelector('[data-slider-next]')?.addEventListener('click', function () { show(index + 1, true); });
    dots.forEach(function (dot) { dot.addEventListener('click', function () { show(Number(dot.dataset.sliderDot), true); }); });
    slider.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowLeft') show(index - 1, true);
      if (event.key === 'ArrowRight') show(index + 1, true);
    });
    slider.addEventListener('pointerdown', function (event) { if (swipe) startX = event.clientX; });
    slider.addEventListener('pointerup', function (event) {
      if (startX == null) return;
      var distance = event.clientX - startX;
      startX = null;
      if (Math.abs(distance) > 50) show(index + (distance < 0 ? 1 : -1), true);
    });
    slider.addEventListener('mouseenter', function () { if (!pauseOnHover) return; window.clearTimeout(timer); slider.classList.remove('is-running'); });
    slider.addEventListener('mouseleave', function () { if (pauseOnHover) schedule(); });
    document.addEventListener('visibilitychange', schedule);
    show(0);
    schedule();
  }

  function boot() { document.querySelectorAll('[data-plugin="property-slider"]').forEach(init); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();


(function() {
    'use strict';
    
    function initGlassButtons() {
        const buttons = document.querySelectorAll('.glassButton');
        
        buttons.forEach(button => {
            // Cria luz do cursor
            let cursorLight = button.querySelector('.glassButton__cursor-light');
            if (!cursorLight) {
                cursorLight = document.createElement('div');
                cursorLight.className = 'glassButton__cursor-light';
                button.appendChild(cursorLight);
            }
            
            const updateMousePosition = (e) => {
                const rect = button.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                button.style.setProperty('--mouse-x', `${(x / rect.width) * 100}%`);
                button.style.setProperty('--mouse-y', `${(y / rect.height) * 100}%`);
                
                if (cursorLight) {
                    cursorLight.style.left = `${x}px`;
                    cursorLight.style.top = `${y}px`;
                }
            };
            
            const handleMouseLeave = () => {
                button.style.setProperty('--mouse-x', '50%');
                button.style.setProperty('--mouse-y', '50%');
                if (cursorLight) cursorLight.style.opacity = '0';
            };
            
            const handleMouseEnter = () => {
                if (cursorLight) cursorLight.style.opacity = '1';
            };
            
            button.addEventListener('mousemove', updateMousePosition);
            button.addEventListener('mouseleave', handleMouseLeave);
            button.addEventListener('mouseenter', handleMouseEnter);
        });
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGlassButtons);
    } else {
        initGlassButtons();
    }
})();


(function(){
  'use strict';

  function ensureFontAwesome(){
    if(document.querySelector('link[data-pit-fontawesome]') || document.querySelector('link[href*="font-awesome"]') || document.querySelector('link[href*="fontawesome"]')) return;
    var link=document.createElement('link');
    link.rel='stylesheet';
    link.href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css';
    link.setAttribute('data-pit-fontawesome','true');
    document.head.appendChild(link);
  }

  function initGlass(button){
    if(!button || button.dataset.pitGlassReady==='1') return;
    button.dataset.pitGlassReady='1';
    var cursorLight=button.querySelector('.glassButton__cursor-light');
    if(!cursorLight){
      cursorLight=document.createElement('div');
      cursorLight.className='glassButton__cursor-light';
      button.appendChild(cursorLight);
    }
    button.addEventListener('mousemove',function(e){
      var rect=button.getBoundingClientRect();
      var x=e.clientX-rect.left, y=e.clientY-rect.top;
      button.style.setProperty('--mouse-x',((x/Math.max(rect.width,1))*100)+'%');
      button.style.setProperty('--mouse-y',((y/Math.max(rect.height,1))*100)+'%');
      cursorLight.style.left=x+'px'; cursorLight.style.top=y+'px';
    });
    button.addEventListener('mouseenter',function(){cursorLight.style.opacity='1'});
    button.addEventListener('mouseleave',function(){
      button.style.setProperty('--mouse-x','50%');button.style.setProperty('--mouse-y','50%');cursorLight.style.opacity='0';
    });
  }

  function init(root){
    if(!root || root.dataset.pitReady==='1') return;
    root.dataset.pitReady='1';
    ensureFontAwesome();
    var button=root.querySelector('.pit-glass-cta');
    if(button){
      if(button.dataset.newTab==='true'){button.target='_blank';button.rel='noopener noreferrer'}
      initGlass(button);
    }
    var animated=[].slice.call(root.querySelectorAll('.pit-animate'));
    var wants=root.querySelector('.pit-section') && root.querySelector('.pit-section').dataset.animate==='true';
    if(!wants || !('IntersectionObserver' in window) || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)){
      animated.forEach(function(el){el.classList.add('pit-visible')});
      return;
    }
    var observer=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){if(entry.isIntersecting){entry.target.classList.add('pit-visible');observer.unobserve(entry.target)}});
    },{threshold:.12,rootMargin:'0px 0px -5% 0px'});
    animated.forEach(function(el){observer.observe(el)});
  }

  function scan(){document.querySelectorAll('[data-plugin="payment-investment-glass-pro"]').forEach(init)}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',scan); else scan();
  var mo=new MutationObserver(scan); mo.observe(document.documentElement,{childList:true,subtree:true});
})();


(function(){})();


(function(){})();


(function(){
  "use strict";
  // 1.2.1: composição balanceada é resolvida por CSS; não há ajuste iterativo de tracking.
})();


(function(){function init(root){if(root.dataset.oppReady)return;root.dataset.oppReady='1';var out=root.querySelector('[data-countdown-value]');if(!out)return;var end=new Date(root.querySelector('.opp-wrap').dataset.countdownEnd||'').getTime();if(!Number.isFinite(end)){out.textContent='Consulte a validade da condição';return}function tick(){var d=end-Date.now();if(d<=0){out.textContent='Consulte a condição atual';return}var days=Math.floor(d/86400000);var hours=Math.floor(d%86400000/3600000);var mins=Math.floor(d%3600000/60000);var secs=Math.floor(d%60000/1000);out.textContent=days+'d '+String(hours).padStart(2,'0')+'h '+String(mins).padStart(2,'0')+'m '+String(secs).padStart(2,'0')+'s'}tick();setInterval(tick,1000)}document.querySelectorAll('[data-plugin="offer-price-pro"]').forEach(init)})();

(function(){
  'use strict';

  function decodeHtml(value){
    return String(value || '').replace(/&amp;/gi, '&').trim();
  }

  function extractIframeSrc(value){
    var text = decodeHtml(value);
    var match = text.match(/<iframe[\s\S]*?\bsrc\s*=\s*["']([^"']+)["']/i);
    return match && match[1] ? decodeHtml(match[1]) : text;
  }

  function safeUrl(value){
    var text = extractIframeSrc(value);
    if (!/^https?:\/\//i.test(text)) return '';
    try { return new URL(text); } catch (e) { return ''; }
  }

  function embedFromUrl(value, address){
    var parsed = safeUrl(value);
    var fallback = String(address || '').trim();

    if (parsed) {
      var host = parsed.hostname.toLowerCase();
      var isGoogle = host === 'google.com' || host.endsWith('.google.com') || host === 'maps.google.com' || host === 'maps.app.goo.gl';

      if (isGoogle) {
        if (/\/maps\/embed/i.test(parsed.pathname) || parsed.searchParams.get('output') === 'embed') {
          return parsed.href;
        }

        var q = parsed.searchParams.get('q') || parsed.searchParams.get('query') || parsed.searchParams.get('ll');
        if (q) {
          return 'https://www.google.com/maps?q=' + encodeURIComponent(q) + '&output=embed';
        }

        var coords = parsed.href.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
        if (coords) {
          return 'https://www.google.com/maps?q=' + encodeURIComponent(coords[1] + ',' + coords[2]) + '&output=embed';
        }
      }
    }

    if (fallback) {
      return 'https://www.google.com/maps?q=' + encodeURIComponent(fallback) + '&output=embed';
    }

    return '';
  }

  function renderMap(section){
    if (!section) return;

    var map = section.querySelector('.location-map');
    if (!map) return;

    var link = map.querySelector('a');
    var addressNode = section.querySelector('.location-layout .address');
    var address = addressNode ? addressNode.textContent.trim() : '';
    var source = link ? (link.getAttribute('href') || '') : '';
    var src = embedFromUrl(source, address);
    if (!src) return;

    var frame = map.querySelector('iframe.location-map-frame');
    if (!frame) {
      frame = document.createElement('iframe');
      frame.className = 'location-map-frame';
      frame.setAttribute('title', 'Localização no Google Maps');
      frame.setAttribute('loading', 'lazy');
      frame.setAttribute('allowfullscreen', '');
      frame.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
      map.insertBefore(frame, map.firstChild);
    }

    if (frame.getAttribute('src') !== src) frame.setAttribute('src', src);
    if (window.__IMOBIFY_EDITOR__) frame.style.pointerEvents = 'none';
    map.classList.add('has-google-map');
  }

  function enhancePlaces(section){
    section.querySelectorAll('.location-places li').forEach(function(item){
      if (item.querySelector('strong')) return;
      var raw = (item.textContent || '').trim();
      var separator = raw.indexOf('|');
      if (separator < 0) return;
      var time = raw.slice(0, separator).trim();
      var place = raw.slice(separator + 1).trim();
      item.textContent = '';
      var strong = document.createElement('strong');
      var span = document.createElement('span');
      strong.textContent = time;
      span.textContent = place;
      item.append(strong, span);
    });
  }

  function boot(scope){
    var root = scope && scope.querySelectorAll ? scope : document;
    root.querySelectorAll('.location-section').forEach(function(section){
      enhancePlaces(section);
      renderMap(section);
    });
  }

  function start(){
    boot(document);
    if (!document.documentElement) return;
    new MutationObserver(function(mutations){
      var needsRender = mutations.some(function(mutation){ return mutation.addedNodes && mutation.addedNodes.length; });
      if (needsRender) boot(document);
    }).observe(document.documentElement, {childList:true, subtree:true});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();


(function(){document.querySelectorAll('[data-plugin="faq"] details').forEach(item=>item.addEventListener('toggle',()=>{if(item.open)window.Imobify&&Imobify.track('faq_open',{question:item.querySelector('summary').textContent.replace('+','').trim()});}));})();


/**
 * ================================================================
 * notify-send.js v1.2.0 - Sistema de Notificações e Alertas
 * ================================================================
 */

(function() {
    'use strict';
    
    // ============================================================
    // CONFIGURAÇÕES
    // ============================================================
    
    const CONFIG = {
        notificationDuration: 5000,
        alertDefaultAvatar: 'fa-info-circle',
        alertTypes: {
            success: { icon: 'fa-check-circle', color: '#27ae60', title: 'Sucesso' },
            error: { icon: 'fa-times-circle', color: '#e74c3c', title: 'Erro' },
            warning: { icon: 'fa-exclamation-triangle', color: '#f39c12', title: 'Atenção' },
            info: { icon: 'fa-info-circle', color: '#3498db', title: 'Informação' },
            question: { icon: 'fa-question-circle', color: '#9b59b6', title: 'Pergunta' }
        },
        defaultMessages: {
            success: { title: 'Sucesso!', message: 'Operação realizada com sucesso.' },
            error: { title: 'Erro!', message: 'Ocorreu um erro. Tente novamente.' },
            warning: { title: 'Atenção!', message: 'Verifique as informações antes de continuar.' },
            info: { title: 'Informação', message: 'Aguarde enquanto processamos sua solicitação.' }
        },
        icons: {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        },
        defaultAvatar: 'fa-bell'
    };
    
    // ============================================================
    // CRIAÇÃO DOS CONTAINERS
    // ============================================================
    
    function createContainers() {
        // Container de Notificações
        if (!document.getElementById('ns-notification-container')) {
            const container = document.createElement('div');
            container.id = 'ns-notification-container';
            container.className = 'ns-notification-container';
            document.body.appendChild(container);
        }
        
        // Modal Overlay
        if (!document.getElementById('ns-modal-overlay')) {
            const modalOverlay = document.createElement('div');
            modalOverlay.id = 'ns-modal-overlay';
            modalOverlay.className = 'ns-modal-overlay';
            modalOverlay.innerHTML = `
                <div class="ns-modal">
                    <div class="ns-modal-avatar-container" style="text-align: center; margin-bottom: 15px; display: none;">
                        <div class="ns-modal-avatar" style="width: 80px; height: 80px; border-radius: 50%; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; overflow: hidden;">
                            <i class="fas fa-info-circle" style="font-size: 48px; color: white;"></i>
                        </div>
                    </div>
                    <div class="ns-modal-icon" style="text-align: center; font-size: 50px; margin-bottom: 20px;">
                        <i class="fas fa-info-circle"></i>
                    </div>
                    <h2 class="ns-modal-title">Título</h2>
                    <p class="ns-modal-message">Mensagem</p>
                    <div class="ns-modal-buttons">
                        <button class="ns-modal-button confirm" style="background: #3498db; padding: 12px 28px; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; color: white;">OK</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modalOverlay);
        }
        
        // Toast
        if (!document.getElementById('ns-toast')) {
            const toast = document.createElement('div');
            toast.id = 'ns-toast';
            toast.className = 'ns-toast';
            document.body.appendChild(toast);
        }
    }
    
    // ============================================================
    // FUNÇÃO PRINCIPAL: ALERT COM AVATAR
    // ============================================================
    
    window.notify_Send_alert = function(message, type = 'info', title = '', avatar = '') {
        return new Promise((resolve) => {
            const modalOverlay = document.getElementById('ns-modal-overlay');
            if (!modalOverlay) {
                console.error('notify_Send: Modal overlay não encontrado');
                resolve();
                return;
            }
            
            const modal = modalOverlay.querySelector('.ns-modal');
            const modalTitle = modal.querySelector('.ns-modal-title');
            const modalMessage = modal.querySelector('.ns-modal-message');
            const confirmBtn = modal.querySelector('.ns-modal-button.confirm');
            const modalIcon = modal.querySelector('.ns-modal-icon');
            const modalIconI = modal.querySelector('.ns-modal-icon i');
            const avatarContainer = modal.querySelector('.ns-modal-avatar-container');
            const avatarDiv = modal.querySelector('.ns-modal-avatar');
            
            // Configurar tipo
            const typeConfig = CONFIG.alertTypes[type] || CONFIG.alertTypes.info;
            const finalTitle = title || typeConfig.title;
            
            // Atualizar conteúdo
            modalTitle.textContent = finalTitle;
            modalMessage.textContent = message || 'Mensagem';
            confirmBtn.textContent = 'OK';
            confirmBtn.style.background = typeConfig.color;
            
            // Configurar avatar
            if (avatar) {
                // Mostrar container de avatar, esconder ícone padrão
                avatarContainer.style.display = 'block';
                modalIcon.style.display = 'none';
                
                // Configurar avatar
                if (avatar.match(/^(https?:\/\/|data:image|\/)/i) || avatar.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
                    // É URL de imagem
                    avatarDiv.innerHTML = `<img src="${avatar}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover;">`;
                } else if (avatar.startsWith('fa-')) {
                    // É ícone Font Awesome
                    avatarDiv.innerHTML = `<i class="fas ${avatar}" style="font-size: 48px; color: white;"></i>`;
                } else {
                    // Fallback
                    avatarDiv.innerHTML = `<i class="fas ${CONFIG.alertDefaultAvatar}" style="font-size: 48px; color: white;"></i>`;
                }
            } else {
                // Sem avatar, mostrar ícone padrão do tipo
                avatarContainer.style.display = 'none';
                modalIcon.style.display = 'block';
                if (modalIconI) {
                    modalIconI.className = `fas ${typeConfig.icon}`;
                    modalIconI.style.color = typeConfig.color;
                }
            }
            
            // Função para fechar
            function closeModal() {
                modalOverlay.classList.remove('show');
                resolve();
            }
            
            // Remover listener antigo e adicionar novo
            const newConfirmBtn = confirmBtn.cloneNode(true);
            confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
            
            newConfirmBtn.addEventListener('click', closeModal);
            
            // Fechar ao clicar fora
            modalOverlay.onclick = function(e) {
                if (e.target === modalOverlay) {
                    closeModal();
                }
            };
            
            // Mostrar modal
            modalOverlay.classList.add('show');
        });
    };
    
    // ============================================================
    // SOBRESCREVER ALERT NATIVO
    // ============================================================
    
    let alertOverridden = false;
    let originalAlert = null;
    
    window.notify_Send_override_alert = function(enable = true, defaultAvatar = '') {
        if (enable && !alertOverridden) {
            // Salvar referência do alert original
            originalAlert = window.alert;
            
            // Substituir
            window.alert = function(message) {
                window.notify_Send_alert(message, 'info', 'Aviso', defaultAvatar);
            };
            alertOverridden = true;
            console.log('✅ Alert nativo substituído pelo notify_Send_alert');
        } else if (!enable && alertOverridden) {
            // Restaurar alert original
            window.alert = originalAlert;
            alertOverridden = false;
            console.log('✅ Alert nativo restaurado');
        }
    };
    
    // ============================================================
    // FUNÇÕES DE NOTIFICAÇÃO
    // ============================================================
    
    function getAvatarHTML(avatar) {
        if (!avatar) {
            return `<div class="ns-notification-avatar"><i class="fas ${CONFIG.defaultAvatar}"></i></div>`;
        }
        
        if (avatar.match(/^(https?:\/\/|data:image|\/)/i) || avatar.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
            return `<div class="ns-notification-avatar"><img src="${avatar}" alt="Avatar" onerror="this.parentElement.innerHTML='<i class=\'fas fa-user-circle\'></i>'"></div>`;
        }
        
        if (avatar.startsWith('fa-')) {
            return `<div class="ns-notification-avatar"><i class="fas ${avatar}"></i></div>`;
        }
        
        return `<div class="ns-notification-avatar"><i class="fas fa-user-circle"></i></div>`;
    }
    
    function closeNotification(notificationElement) {
        if (!notificationElement || !notificationElement.parentElement) return;
        notificationElement.classList.remove('show');
        notificationElement.classList.add('hide');
        setTimeout(() => {
            if (notificationElement.parentElement) {
                notificationElement.parentElement.removeChild(notificationElement);
            }
        }, 400);
    }
    
    window.notify_Send_notification = function(type, message = '', title = '', avatar = '') {
        const validTypes = ['success', 'error', 'warning', 'info'];
        if (!validTypes.includes(type)) {
            console.warn(`notify_Send: Tipo inválido "${type}". Usando "info".`);
            type = 'info';
        }
        
        const finalTitle = title || CONFIG.defaultMessages[type].title;
        const finalMessage = message || CONFIG.defaultMessages[type].message;
        
        const notification = document.createElement('div');
        notification.className = `ns-notification ${type}`;
        
        const avatarHTML = getAvatarHTML(avatar);
        const iconHTML = !avatar ? `<i class="fas ${CONFIG.icons[type]} ns-notification-icon"></i>` : '';
        
        notification.innerHTML = `
            ${avatarHTML}
            ${iconHTML}
            <div class="ns-notification-content">
                <div class="ns-notification-title">${escapeHtml(finalTitle)}</div>
                <div class="ns-notification-message">${escapeHtml(finalMessage)}</div>
            </div>
            <button class="ns-notification-close" onclick="notify_Send_close_notification(this.parentElement)">
                <i class="fas fa-times"></i>
            </button>
            <div class="ns-notification-progress"></div>
        `;
        
        const container = document.getElementById('ns-notification-container');
        if (container) {
            container.appendChild(notification);
        } else {
            console.error('notify_Send: Container de notificações não encontrado');
            return;
        }
        
        setTimeout(() => {
            notification.classList.add('show');
            const progressBar = notification.querySelector('.ns-notification-progress');
            if (progressBar) {
                setTimeout(() => {
                    progressBar.style.transform = 'scaleX(0)';
                }, 50);
            }
        }, 10);
        
        const timeoutId = setTimeout(() => {
            if (notification.parentElement) {
                closeNotification(notification);
            }
        }, CONFIG.notificationDuration);
        
        notification.dataset.timeoutId = timeoutId;
    };
    
    window.notify_Send_close_notification = function(notificationElement) {
        if (notificationElement && notificationElement.dataset.timeoutId) {
            clearTimeout(parseInt(notificationElement.dataset.timeoutId));
        }
        closeNotification(notificationElement);
    };
    
    window.notify_Send_close_all = function() {
        const container = document.getElementById('ns-notification-container');
        if (container) {
            const notifications = container.querySelectorAll('.ns-notification');
            notifications.forEach(notification => {
                closeNotification(notification);
            });
        }
    };
    
    window.notify_Send_toast = function(message, duration = 3000) {
        const toast = document.getElementById('ns-toast');
        if (!toast) {
            console.error('notify_Send: Toast element não encontrado');
            return;
        }
        toast.textContent = message || 'Notificação';
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    };
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Inicialização
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createContainers);
    } else {
        createContainers();
    }
    
    console.log('🎉 notify-send.js carregado com sucesso!');
    console.log('📌 Funções disponíveis:');
    console.log('   - notify_Send_alert()');
    console.log('   - notify_Send_notification()');
    console.log('   - notify_Send_modal()');
    console.log('   - notify_Send_toast()');
    console.log('   - notify_Send_override_alert()');
    
})();

/**
 * formsenderJS.Plugin - Formulário de contato com validação e integração com notify-send
 * 
 * Uso:
 * new formsenderJS.Plugin('#meu-formulario', {
 *   produto: 'The Garden - New Edition',
 *   endpoint: 'https://script.google.com/macros/s/.../exec',
 *   textoBotao: 'Enviar Mensagem'
 * });
 */
(function() {
    'use strict';

    window.formsenderJS = window.formsenderJS || {};

    class FormPlugin {
        constructor(selector, options = {}) {
            // Container
            this.container = document.querySelector(selector);
            if (!this.container) {
                console.error(`[formsenderJS] Elemento "${selector}" não encontrado.`);
                throw new Error(`Elemento "${selector}" não encontrado.`);
            }

            // Opções padrão
            const defaults = {
                produto: 'The Garden - New Edition',
                endpoint: '',                    // obrigatório
                textoBotao: 'Enviar Mensagem',
                mostrarMensagem: true,
                mostrarCheckboxes: false,
                mostrarDataNasc: false,
                notificacao: null,               // função personalizada (tipo, mensagem, titulo)
                onSuccess: null,
                onError: null
            };
            this.opts = { ...defaults, ...options };

            if (!this.opts.endpoint) {
                throw new Error('[formsenderJS] A opção "endpoint" é obrigatória.');
            }

            // Gera ID único
            this.uid = 'fs-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);

            // Constrói o HTML
            this.buildForm();

            // Inicializa eventos
            this.initEvents();

            console.log('[formsenderJS] Plugin inicializado com sucesso!');
        }

        // ---------- Monta o formulário (com prefixo CSS) ----------
        buildForm() {
            const uid = this.uid;
            const opts = this.opts;
            const css = 'formsenderCSS_';

            const hiddenFields = `
                <input type="hidden" name="produto" value="${opts.produto.replace(/"/g, '&quot;')}">
                <input type="hidden" name="dataHora" id="dataHora_${uid}">
            `;

            const nascimentoHtml = opts.mostrarDataNasc ? `
                <div class="${css}field">
                    <label for="nascimento_${uid}" class="${css}label">Data de Nascimento</label>
                    <input type="date" id="nascimento_${uid}" name="nascimento" class="${css}input">
                </div>
            ` : `
                <input type="date" name="nascimento" style="display:none;">
            `;

            const checkboxesHtml = opts.mostrarCheckboxes ? `
                <div class="${css}field">
                    <label class="${css}label">Informações Adicionais</label>
                    <div class="${css}checkbox-group">
                        <label class="${css}checkbox">
                            <input type="checkbox" name="anosCtps" value="X"> 3 Anos de carteira assinada?
                        </label>
                        <label class="${css}checkbox">
                            <input type="checkbox" name="fatorsocial" value="X"> Possui cônjuge ou dependente(a)
                        </label>
                        <label class="${css}checkbox">
                            <input type="checkbox" name="imovelnome" value="X"> Possui imóvel no nome?
                        </label>
                    </div>
                </div>
            ` : '';

            const mensagemHtml = opts.mostrarMensagem ? `
                <div class="${css}field">
                    <label for="msg_${uid}" class="${css}label">Mensagem</label>
                    <textarea id="msg_${uid}" name="msg" rows="4" class="${css}input ${css}textarea"></textarea>
                </div>
            ` : '';

            const formHtml = `
                <form id="form_${uid}" class="${css}form" novalidate>
                    ${hiddenFields}
                    <div class="${css}field">
                        <label for="nome_${uid}" class="${css}label">Nome Completo *</label>
                        <input type="text" id="nome_${uid}" name="nome" required class="${css}input">
                    </div>
                    <div class="${css}row">
                        <div class="${css}col">
                            <label for="email_${uid}" class="${css}label">E-mail *</label>
                            <input type="email" id="email_${uid}" name="email" required class="${css}input">
                        </div>
                        <div class="${css}col">
                            <label for="telefone_${uid}" class="${css}label">Telefone *</label>
                            <input type="tel" id="telefone_${uid}" name="telefone" required class="${css}input">
                        </div>
                    </div>
                    ${nascimentoHtml}
                    ${checkboxesHtml}
                    ${mensagemHtml}
                    <button type="submit" id="submit_${uid}" class="${css}button">${opts.textoBotao}</button>
                    <div id="resposta_${uid}" class="${css}resposta"></div>
                </form>
            `;

            this.container.innerHTML = formHtml;

            // Referências
            this.form = document.getElementById(`form_${uid}`);
            this.submitBtn = document.getElementById(`submit_${uid}`);
            this.resposta = document.getElementById(`resposta_${uid}`);
            this.dataHoraInput = document.getElementById(`dataHora_${uid}`);
        }

        // ---------- Eventos ----------
        initEvents() {
            // Máscara de telefone
            const telInput = this.form.querySelector('input[name="telefone"]');
            if (telInput) {
                telInput.addEventListener('input', (e) => {
                    let value = e.target.value.replace(/\D/g, '');
                    if (value.length > 11) value = value.substring(0, 11);
                    if (value.length > 0) {
                        value = value.replace(/^(\d{0,2})(\d{0,5})(\d{0,4}).*/, '($1) $2-$3');
                    }
                    e.target.value = value;
                });
            }

            // Validação de data
            const dateInput = this.form.querySelector('input[type="date"]');
            if (dateInput && this.opts.mostrarDataNasc) {
                dateInput.addEventListener('change', (e) => {
                    const selected = new Date(e.target.value);
                    const today = new Date();
                    if (selected > today) {
                        this.mostrarNotificacao('error', 'Data de nascimento não pode ser no futuro', 'Erro!');
                        e.target.value = '';
                    }
                });
            }

            // Envio
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // ---------- VALIDAÇÃO MANUAL DOS CAMPOS OBRIGATÓRIOS ----------
        validarCampos() {
            // Define quais campos são obrigatórios conforme as opções
            const obrigatorios = ['nome', 'email', 'telefone'];
            
            // Se quiser tornar a data obrigatória, descomente a linha abaixo:
            // if (this.opts.mostrarDataNasc) obrigatorios.push('nascimento');

            let valido = true;
            const css = 'formsenderCSS_';

            for (const campo of obrigatorios) {
                const input = this.form.querySelector(`[name="${campo}"]`);
                if (input) {
                    // Remove espaços e verifica se está vazio
                    if (!input.value.trim()) {
                        input.classList.add(`${css}input_error`);
                        valido = false;
                    } else {
                        input.classList.remove(`${css}input_error`);
                    }
                }
            }
            return valido;
        }

        // ---------- Envio com validação ----------
        handleSubmit(e) {
            e.preventDefault();

            // 1. VALIDA OS CAMPOS
            if (!this.validarCampos()) {
                this.mostrarNotificacao('error', 'Preencha todos os campos obrigatórios.', 'Atenção!');
                return; // Não envia
            }

            // 2. DESABILITA BOTÃO
            this.submitBtn.disabled = true;
            const originalText = this.submitBtn.textContent;
            this.submitBtn.textContent = 'Enviando...';

            // 3. PREENCHE DATA/HORA
            if (this.dataHoraInput) {
                this.dataHoraInput.value = new Date().toLocaleString('pt-BR');
            }

            const formData = new FormData(this.form);

            // 4. ENVIA
            fetch(this.opts.endpoint, {
                method: 'POST',
                body: formData,
            })
                .then(response => response.text())
                .then(msg => {
                    this.resposta.innerText = msg;
                    this.resposta.className = 'formsenderCSS_resposta formsenderCSS_success';
                    this.mostrarNotificacao('success', 'Mensagem enviada com sucesso!', 'Sucesso!');
                    this.form.reset();
                    if (this.opts.onSuccess) this.opts.onSuccess(msg);
                })
                .catch(err => {
                    this.resposta.innerText = 'Erro ao enviar dados. Por favor, tente novamente.';
                    this.resposta.className = 'formsenderCSS_resposta formsenderCSS_error';
                    this.mostrarNotificacao('error', 'Erro no envio. Tente novamente.', 'Erro!');
                    console.error(err);
                    if (this.opts.onError) this.opts.onError(err);
                })
                .finally(() => {
                    this.submitBtn.disabled = false;
                    this.submitBtn.textContent = originalText;
                    setTimeout(() => {
                        this.resposta.innerText = '';
                        this.resposta.className = 'formsenderCSS_resposta';
                    }, 3000);
                });
        }

        // ---------- Sistema de notificação (integrado ao notify-send) ----------
        mostrarNotificacao(tipo, mensagem, titulo) {
            // 1. Se o usuário forneceu uma função personalizada, usa ela
            if (typeof this.opts.notificacao === 'function') {
                this.opts.notificacao(tipo, mensagem, titulo);
                return;
            }

            // 2. Se o notify-send estiver disponível, usa-o
            if (typeof window.notify_Send_notification === 'function') {
                const avatar = (tipo === 'success')
                    ? 'https://randomuser.me/api/portraits/men/32.jpg'
                    : 'fas fa-exclamation-triangle';
                window.notify_Send_notification(tipo, mensagem, titulo, avatar);
                return;
            }

            // 3. Fallback para showfeedview_notification
            if (typeof window.showfeedview_notification === 'function') {
                window.showfeedview_notification(tipo, mensagem, titulo);
                return;
            }

            // 4. Último recurso: alert simples
            alert(`${titulo}: ${mensagem}`);
        }
    }

    // Exporta a classe no namespace
    window.formsenderJS.Plugin = FormPlugin;

    //console.log(' formsenderJS.Plugin carregado com sucesso!');
    //console.log(' Uso: new formsenderJS.Plugin("#seletor", { ... });');
})();

(function () {
  'use strict';

  function enabled(value) {
    return value === 'true' || value === '1' || value === 'on';
  }



  function quickQuestion(mount, index) {
    var prefix = 'quickQ' + index;
    var key = prefix.charAt(0).toLowerCase() + prefix.slice(1);
    function ds(suffix) { return mount.dataset[key + suffix] || ''; }
    var type = ds('Type') || 'single';
    var options = ds('Options').split('|').map(function (item) { return item.trim(); }).filter(Boolean);
    if (type === 'yesno') options = ['Sim', 'Não'];
    if (type === 'truefalse') options = ['Verdadeiro', 'Falso'];
    return {
      enabled: enabled(ds('Enabled')),
      label: ds('Label') || ('Pergunta ' + index),
      type: type,
      options: options,
      required: true
    };
  }

  function applyPossibilitySummary(mount, explicitSummary) {
    var summary = String(explicitSummary || '');
    if (!summary) { try { summary = sessionStorage.getItem('imobify:possibility-path-summary') || ''; } catch (_) {} }
    if (!summary) return;
    var form = mount && mount.querySelector('form');
    if (!form) return;
    var msg = form.querySelector('textarea[name="msg"]');
    if (msg && !msg.value.trim()) msg.value = summary;
    var hidden = form.querySelector('input[name="diagnosticoPossibilidade"]');
    if (!hidden) { hidden = document.createElement('input'); hidden.type = 'hidden'; hidden.name = 'diagnosticoPossibilidade'; form.appendChild(hidden); }
    hidden.value = summary;
  }


  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }

  function openQuickComplement(instance, config) {
    return new Promise(function (resolve) {
      var questions = (config.questions || []).filter(function (q) { return q && q.enabled !== false && q.label; });
      if (!questions.length) { resolve([]); return; }
      var old = document.getElementById('quick_' + instance.uid); if (old) old.remove();
      function choices(q) {
        if (q.type === 'yesno') return ['Sim','Não'];
        if (q.type === 'truefalse') return ['Verdadeiro','Falso'];
        return Array.isArray(q.options) ? q.options : [];
      }
      var overlay = document.createElement('div');
      overlay.id = 'quick_' + instance.uid;
      overlay.className = 'formsenderCSS_quick-overlay';
      overlay.setAttribute('role','dialog'); overlay.setAttribute('aria-modal','true');
      overlay.innerHTML = '<div class="formsenderCSS_quick-card">' +
        '<div class="formsenderCSS_quick-head"><span class="formsenderCSS_quick-kicker">Só mais um detalhe</span>' +
        '<h3>' + escapeHtml(config.title || 'Antes de finalizar, só me confirma rapidinho…') + '</h3>' +
        (config.copy ? '<p>' + escapeHtml(config.copy) + '</p>' : '') + '</div>' +
        (questions.length > 1 ? '<div class="formsenderCSS_quick-progress" aria-live="polite"><span data-quick-current>1</span> de ' + questions.length + '</div>' : '') +
        '<div class="formsenderCSS_quick-questions">' + questions.map(function (q, i) {
          return '<fieldset class="formsenderCSS_quick-question' + (i === 0 ? ' is-active' : '') + '" data-quick-question="' + i + '">' +
            '<legend>' + escapeHtml(q.label) + ' *</legend>' +
            '<div class="formsenderCSS_quick-options">' + choices(q).map(function (option) {
              return '<button type="button" class="formsenderCSS_quick-option" data-value="' + escapeHtml(option) + '">' + escapeHtml(option) + '</button>';
            }).join('') + '</div><small>Selecione uma opção para continuar.</small></fieldset>';
        }).join('') + '</div>' +
        '<div class="formsenderCSS_quick-actions">' +
        '<button type="button" class="formsenderCSS_quick-confirm">' + escapeHtml(config.confirmText || 'Concluir envio') + '</button></div></div>';
      document.body.appendChild(overlay);
      document.documentElement.classList.add('formsender-quick-open');
      requestAnimationFrame(function () { overlay.classList.add('is-open'); });
      var selected = new Map();
      var activeIndex = 0;
      var isMobile = false;
      try { isMobile = window.matchMedia ? window.matchMedia('(max-width: 640px)').matches : window.innerWidth <= 640; } catch (_) {}
      var progressCurrent = overlay.querySelector('[data-quick-current]');
      var questionsWrap = overlay.querySelector('.formsenderCSS_quick-questions');
      var confirmButton = overlay.querySelector('.formsenderCSS_quick-confirm');
      var quickCard = overlay.querySelector('.formsenderCSS_quick-card');
      var fitRaf = 0;
      var viewportResizeTarget = window.visualViewport || null;

      function fitMobileCard() {
        if (!isMobile || !quickCard) return;
        if (fitRaf) cancelAnimationFrame(fitRaf);
        fitRaf = requestAnimationFrame(function () {
          fitRaf = 0;
          var vw = viewportResizeTarget ? viewportResizeTarget.width : window.innerWidth;
          var vh = viewportResizeTarget ? viewportResizeTarget.height : window.innerHeight;
          var naturalWidth = Math.max(1, quickCard.offsetWidth);
          var naturalHeight = Math.max(1, quickCard.scrollHeight);
          overlay.style.setProperty('--formsender-vv-width', Math.round(vw) + 'px');
          overlay.style.setProperty('--formsender-vv-height', Math.round(vh) + 'px');
          var availableWidth = Math.max(1, vw - 24);
          var availableHeight = Math.max(1, vh - 24);
          var scale = Math.min(1, availableWidth / naturalWidth, availableHeight / naturalHeight);
          if (!isFinite(scale) || scale <= 0) scale = 1;
          quickCard.style.setProperty('--formsender-mobile-scale', String(Math.max(.55, scale)));
        });
      }

      function currentNode(index) { return overlay.querySelector('[data-quick-question="' + index + '"]'); }
      function currentAnswer(index) {
        var raw = selected.get(index);
        return Array.isArray(raw) ? raw.join(', ') : (raw || '');
      }
      function updateMobileHeight() {
        if (!isMobile || !questionsWrap) return;
        /* A pergunta ativa permanece no fluxo normal. Não fixamos a altura do wrapper:
           isso evita que opções maiores que a etapa anterior vazem para fora do card. */
        questionsWrap.style.removeProperty('height');
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { fitMobileCard(); });
        });
      }
      function updateActionLabel() {
        if (!confirmButton) return;
        if (!isMobile) {
          confirmButton.hidden = false;
          confirmButton.textContent = config.confirmText || 'Concluir envio';
          overlay.classList.add('has-mobile-action');
          return;
        }
        var q = questions[activeIndex];
        var needsAction = q && (q.type || 'single') === 'multiple';
        confirmButton.hidden = !needsAction;
        overlay.classList.toggle('has-mobile-action', !!needsAction);
        if (needsAction) confirmButton.textContent = activeIndex < questions.length - 1 ? 'Concluir seleção' : (config.confirmText || 'Concluir envio');
      }
      function showStep(nextIndex, immediate) {
        if (!isMobile) return;
        nextIndex = Math.max(0, Math.min(questions.length - 1, nextIndex));
        var oldNode = currentNode(activeIndex);
        var newNode = currentNode(nextIndex);
        if (!newNode || nextIndex === activeIndex) { updateMobileHeight(); updateActionLabel(); return; }
        function activate() {
          if (oldNode) oldNode.classList.remove('is-active','is-leaving');
          activeIndex = nextIndex;
          newNode.classList.add('is-active');
          if (progressCurrent) progressCurrent.textContent = String(activeIndex + 1);
          updateActionLabel();
          updateMobileHeight();
          requestAnimationFrame(function () { newNode.classList.add('is-entered'); });
          setTimeout(function () { newNode.classList.remove('is-entered'); }, 220);
        }
        if (immediate || !oldNode) activate();
        else {
          oldNode.classList.add('is-leaving');
          setTimeout(activate, 140);
        }
      }
      function validateIndex(index) {
        var q = questions[index];
        var answer = currentAnswer(index);
        var node = currentNode(index);
        if (q && !answer) { if (node) node.classList.add('has-error'); return false; }
        if (node) node.classList.remove('has-error');
        return true;
      }
      function collectAnswers() {
        var valid = true;
        var answers = questions.map(function (q, index) {
          var answer = currentAnswer(index);
          if (!answer) { valid = false; var node = currentNode(index); if (node) node.classList.add('has-error'); }
          return { label:q.label, answer:answer };
        });
        return { valid:valid, answers:answers };
      }
      function cleanup() {
        document.documentElement.classList.remove('formsender-quick-open');
        if (fitRaf) cancelAnimationFrame(fitRaf);
        window.removeEventListener('resize', fitMobileCard);
        window.removeEventListener('orientationchange', fitMobileCard);
        if (viewportResizeTarget && viewportResizeTarget.removeEventListener) viewportResizeTarget.removeEventListener('resize', fitMobileCard);
        document.removeEventListener('keydown', blockEscape, true);
        overlay.classList.add('is-closing');
        setTimeout(function () { overlay.remove(); }, 180);
      }
      function finish(answers) {
        cleanup();
        resolve({ cancelled:false, answers:answers || [] });
      }

      overlay.querySelectorAll('.formsenderCSS_quick-option').forEach(function (button) {
        button.addEventListener('click', function () {
          var fieldset = button.closest('[data-quick-question]');
          var index = Number(fieldset.dataset.quickQuestion); var q = questions[index]; var value = button.dataset.value || '';
          if ((q.type || 'single') === 'multiple') {
            var values = selected.get(index) || [];
            var next = values.indexOf(value) >= 0 ? values.filter(function (v) { return v !== value; }) : values.concat([value]);
            selected.set(index, next); button.classList.toggle('is-selected', next.indexOf(value) >= 0);
          } else {
            selected.set(index, value);
            fieldset.querySelectorAll('.formsenderCSS_quick-option').forEach(function (el) { el.classList.toggle('is-selected', el === button); });
          }
          fieldset.classList.remove('has-error');
          if (isMobile && (q.type || 'single') !== 'multiple' && index === activeIndex) {
            if (index < questions.length - 1) {
              setTimeout(function () { showStep(index + 1, false); }, 110);
            } else {
              setTimeout(function () {
                var result = collectAnswers();
                if (result.valid) finish(result.answers);
              }, 110);
            }
          }
        });
      });

      confirmButton.addEventListener('click', function () {
        if (isMobile) {
          var currentQuestion = questions[activeIndex];
          if (!currentQuestion || (currentQuestion.type || 'single') !== 'multiple') return;
          if (!validateIndex(activeIndex)) return;
          if (activeIndex < questions.length - 1) {
            showStep(activeIndex + 1, false);
            return;
          }
        }
        var result = collectAnswers();
        if (result.valid) finish(result.answers);
        else if (isMobile) {
          var firstInvalid = questions.findIndex(function (q, index) { return !currentAnswer(index); });
          if (firstInvalid >= 0) showStep(firstInvalid, true);
        }
      });
      overlay.addEventListener('click', function (event) {
        if (event.target === overlay) {
          event.preventDefault();
          event.stopPropagation();
        }
      });
      function blockEscape(event) {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      }
      document.addEventListener('keydown', blockEscape, true);

      if (isMobile) {
        overlay.classList.add('is-mobile-steps');
        updateActionLabel();
        updateMobileHeight();
        window.addEventListener('resize', fitMobileCard, { passive:true });
        window.addEventListener('orientationchange', fitMobileCard, { passive:true });
        if (viewportResizeTarget && viewportResizeTarget.addEventListener) viewportResizeTarget.addEventListener('resize', fitMobileCard, { passive:true });
        setTimeout(fitMobileCard, 40);
      }
    });
  }

  function appendQuickAnswers(instance, answers) {
    var answered = (answers || []).filter(function (item) { return item && String(item.answer || '').trim(); });
    if (!answered.length) return;
    var block = answered.map(function (item) { return item.label + '\n' + item.answer + ';'; }).join('\n\n');
    var form = instance.form; if (!form) return;
    var msg = form.querySelector('[name="msg"]');
    if (!msg) { msg = document.createElement('input'); msg.type = 'hidden'; msg.name = 'msg'; form.appendChild(msg); }
    var original = String(msg.value || '').trim();
    msg.value = [original, 'Informações complementares:', block].filter(Boolean).join('\n\n');
    var hidden = form.querySelector('[name="complementacaoRapida"]');
    if (!hidden) { hidden = document.createElement('input'); hidden.type='hidden'; hidden.name='complementacaoRapida'; form.appendChild(hidden); }
    hidden.value = block;
    answered.forEach(function (item, index) {
      var input = form.querySelector('[name="qualificacao_' + (index+1) + '"]');
      if (!input) { input=document.createElement('input'); input.type='hidden'; input.name='qualificacao_' + (index+1); form.appendChild(input); }
      input.value = item.label + '\n' + item.answer + ';';
    });
  }

  function installQuickComplement(instance, config) {
    if (!instance || !config || !config.enabled || !(config.questions || []).length) return;
    var original = instance.handleSubmit.bind(instance);
    var opening = false;
    instance.handleSubmit = function (event) {
      if (opening) { event && event.preventDefault && event.preventDefault(); return; }
      event && event.preventDefault && event.preventDefault();
      if (!instance.validarCampos()) { instance.mostrarNotificacao('error','Preencha todos os campos obrigatórios.','Atenção!'); return; }
      opening = true;
      openQuickComplement(instance, config).then(function (result) {
        if (result && result.cancelled) { opening = false; return; }
        var answers = result && Array.isArray(result.answers) ? result.answers : (Array.isArray(result) ? result : []);
        appendQuickAnswers(instance, answers);
        opening = false;
        original({ preventDefault:function () {} });
      }).catch(function () { opening = false; });
    };
  }

  function configureAutocomplete(instance, shouldEnable) {
    if (!instance || !instance.form) return;
    var fields = [
      { name:'nome', token:'name', extra:{ autocapitalize:'words' } },
      { name:'email', token:'email', extra:{ inputmode:'email', autocapitalize:'none', spellcheck:'false' } },
      { name:'telefone', token:'tel', extra:{ inputmode:'tel' } }
    ];
    fields.forEach(function (item) {
      var input = instance.form.querySelector('[name="' + item.name + '"]');
      if (!input) return;
      input.setAttribute('autocomplete', shouldEnable ? item.token : 'off');
      Object.keys(item.extra || {}).forEach(function (key) { input.setAttribute(key, item.extra[key]); });
    });
    instance.form.setAttribute('autocomplete', shouldEnable ? 'on' : 'off');
  }

  function initialize() {
    document.querySelectorAll('[data-plugin="form-sender-v4"] .formsenderV4_mount:not([data-initialized])').forEach(function (mount, index) {
      mount.dataset.initialized = 'true';
      mount.id = mount.id || 'formsender-v4-' + Date.now() + '-' + index + '-' + Math.random().toString(36).slice(2, 7);

      if (!window.formsenderJS || typeof window.formsenderJS.Plugin !== 'function') {
        mount.innerHTML = '<p>Não foi possível inicializar o Form.v4.</p>';
        return;
      }

      var endpoint = (mount.dataset.endpoint || '').trim();
      if (!endpoint) {
        mount.innerHTML = '<p>Configure o endpoint do Form.v4 no editor.</p>';
        return;
      }

      if (window.__IMOBIFY_EDITOR__) {
        mount.addEventListener('submit', function (event) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }, true);
      }

      try {
        var quickConfig = {
          enabled: enabled(mount.dataset.quickComplement),
          title: mount.dataset.quickTitle || 'Antes de finalizar, só me confirma rapidinho…',
          copy: mount.dataset.quickCopy || '',
          confirmText: mount.dataset.quickConfirmText || 'Concluir envio',
          questions: [quickQuestion(mount, 1), quickQuestion(mount, 2), quickQuestion(mount, 3), quickQuestion(mount, 4)].filter(function (q) { return q.enabled; })
        };
        var instance = new window.formsenderJS.Plugin('#' + mount.id, {
          produto: mount.dataset.product || 'The Garden - New Edition',
          endpoint: endpoint,
          textoBotao: mount.dataset.buttonText || 'Enviar Mensagem',
          mostrarMensagem: enabled(mount.dataset.showMessage),
          mostrarCheckboxes: enabled(mount.dataset.showCheckboxes),
          mostrarDataNasc: enabled(mount.dataset.showBirthdate),
          notificacao: function (type, message, title) {
            if (type === 'success') return;
            if (typeof window.notify_Send_notification === 'function') {
              window.notify_Send_notification(type, message, title, 'fas fa-exclamation-triangle');
            } else {
              window.alert(title + ': ' + message);
            }
          },
          onSuccess: function () {
            if (typeof window.notify_Send_notification === 'function') {
              window.notify_Send_notification(
                'success',
                mount.dataset.successMessage || 'Nosso consultor entrará em contato!',
                mount.dataset.successTitle || 'Fique atento',
                mount.dataset.successAvatar || ''
              );
            }
          },
          onError: function (error) {
            console.warn('[Form.v4]', error);
          }
        });
        mount.formsenderV4 = instance;
        configureAutocomplete(instance, enabled(mount.dataset.fieldAutocomplete));
        installQuickComplement(instance, quickConfig);
        applyPossibilitySummary(mount);
      } catch (error) {
        console.error('[Form.v4]', error);
        mount.innerHTML = '<p>Erro ao carregar o formulário: ' + String(error.message || error) + '</p>';
      }
    });
  }

  window.addEventListener('imobify:possibility-path-complete', function (event) { document.querySelectorAll('[data-plugin="form-sender-v4"] .formsenderV4_mount').forEach(function (mount) { applyPossibilitySummary(mount, event.detail && event.detail.summary); }); });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
  else initialize();
})();


(function(){
  'use strict';
  function installFallback(image){
    if(image.dataset.footerIconFallback==='true')return;
    image.dataset.footerIconFallback='true';
    image.addEventListener('error',()=>{
      const fallback=document.createElement('i');
      fallback.className='fa-solid fa-link';
      fallback.setAttribute('aria-hidden','true');
      image.replaceWith(fallback);
    },{once:true});
  }
  function init(scope=document){
    scope.querySelectorAll('[data-plugin="footer"] .footer-social-icon img').forEach(installFallback);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>init(),{once:true});
  else init();
})();


(function(){if(!('IntersectionObserver'in window)||matchMedia('(prefers-reduced-motion: reduce)').matches)return;document.documentElement.classList.add('reveal-ready');const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}}),{threshold:.08});document.querySelectorAll('.section-shell:not([data-plugin="parallax"]):not([data-plugin="scrollytelling-video-pro"])').forEach(section=>observer.observe(section));})();


(function(){const triggers=document.querySelectorAll('[data-lightbox-src]');if(!triggers.length)return;const box=document.createElement('div');box.className='imobify-lightbox';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.innerHTML='<button aria-label="Fechar">×</button><img alt="Imagem ampliada">';document.body.append(box);const close=()=>{box.classList.remove('is-open');document.body.classList.remove('no-scroll');};triggers.forEach(trigger=>trigger.addEventListener('click',()=>{box.querySelector('img').src=trigger.dataset.lightboxSrc;box.classList.add('is-open');document.body.classList.add('no-scroll');box.querySelector('button').focus();}));box.addEventListener('click',event=>{if(event.target===box||event.target.tagName==='BUTTON')close();});addEventListener('keydown',event=>{if(event.key==='Escape')close();});})();
