import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');
  const allowScripts = searchParams.get('scripts') === '1'; // Per anteprime: permette JS per pagine SPA

  if (!url) {
    return NextResponse.json(
      { error: 'URL parameter is required' },
      { status: 400 }
    );
  }

  try {
    // Validate URL
    const targetUrl = new URL(url);

    // Headers browser-like per evitare bot detection (Replit/Cloudflare restituiscono 404 a fetch server)
    const browserHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Referer': targetUrl.origin + '/',
      'Sec-Ch-Ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
    };

    // Fetch the page - timeout 30s per Replit/SPA che possono essere lente
    // Include rplt.thesignalmind.com e altri domini SPA noti
    const isReplitOrSPA = /replit\.com|replit\.dev|repl\.co|concealedqualify\.com|thesignalmind\.com|rplt\./i.test(targetUrl.hostname);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), isReplitOrSPA ? 30000 : 15000);
    let response: Response;
    try {
      response = await fetch(targetUrl.toString(), {
        signal: controller.signal,
        headers: browserHeaders,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    // SEMPRE iniettare il path originale quando scripts sono abilitati
    // L'iframe ha pathname="/api/proxy-page" ma il router SPA ha bisogno del path reale
    // history.replaceState viene iniettato PRIMA degli script della SPA
    let injectedPath: string | null = null;
    if (allowScripts && targetUrl.pathname !== '/') {
      injectedPath = targetUrl.pathname + targetUrl.search + targetUrl.hash;
    }

    // Per SPA: la risposta 404 contiene comunque l'app shell completa - usiamola
    if (!response.ok && response.status === 404 && isReplitOrSPA) {
      // Trattiamo questa risposta come utilizzabile (il body ha il contenuto)
    }

    // Per siti non-SPA con 404, prova parent paths e root
    if (!response.ok && response.status === 404 && !isReplitOrSPA && targetUrl.pathname !== '/' && targetUrl.pathname !== '') {
      const originalPath = targetUrl.pathname + targetUrl.search + targetUrl.hash;
      const pathsToTry: string[] = [];
      const pathParts = targetUrl.pathname.split('/').filter(Boolean);
      for (let i = pathParts.length - 1; i >= 0; i--) {
        const parentPath = '/' + pathParts.slice(0, i).join('/') + (i > 0 ? '/' : '');
        if (!pathsToTry.includes(parentPath)) pathsToTry.push(parentPath);
      }
      if (!pathsToTry.includes('/')) pathsToTry.push('/');
      
      for (const tryPath of pathsToTry) {
        const tryUrl = targetUrl.origin + tryPath;
        try {
          const tryController = new AbortController();
          const tryTimeout = setTimeout(() => tryController.abort(), 10000);
          const tryResponse = await fetch(tryUrl, {
            signal: tryController.signal,
            headers: { ...browserHeaders, Referer: tryUrl },
          });
          clearTimeout(tryTimeout);
          if (tryResponse.ok) {
            response = tryResponse;
            injectedPath = originalPath;
            targetUrl.pathname = tryPath;
            targetUrl.search = '';
            targetUrl.hash = '';
            break;
          }
        } catch {
          // Continua con il prossimo path
        }
      }
    }

    // Se ancora fallisce (non SPA, non 404 con body utile) → fallback redirect
    if (!response.ok && !injectedPath) {
      const directUrl = targetUrl.toString().replace(/"/g, '&quot;');
      const fallbackHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"><meta http-equiv="refresh" content="0;url=${directUrl}"></head><body>Redirecting...</body></html>`;
      return new NextResponse(fallbackHtml, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'X-Frame-Options': 'ALLOWALL',
          'Cache-Control': 'no-store',
        },
      });
    }

    let html = await response.text();

    // Remove base tag - pages with wrong base may point images to our domain (404)
    html = html.replace(/<base[^>]*>/gi, '');

    // Remove Cloudflare RUM, cdn-cgi, analytics - cause CORS errors in iframe preview, not needed for display
    html = html.replace(/<script[^>]*src=["'][^"']*\/cdn-cgi\/[^"']*["'][^>]*>[\s\S]*?<\/script>/gi, '');
    html = html.replace(/<script[^>]*src=["'][^"']*cdn-cgi[^"']*["'][^>]*\/?>/gi, '');
    html = html.replace(/<script[^>]*src=["'][^"']*cloudflareinsights[^"']*["'][^>]*\/?>/gi, '');
    html = html.replace(/<link[^>]*href=["'][^"']*\/cdn-cgi\/[^"']*["'][^>]*\/?>/gi, '');

    // Remove meta refresh - evita che checkout/pagine facciano redirect e spariscano dall'anteprima
    html = html.replace(/<meta[^>]*http-equiv\s*=\s*["']refresh["'][^>]*>/gi, '');

    // Inject correct base - any missed relative URLs resolve to source domain (fix 404 images)
    const correctBase = targetUrl.origin + targetUrl.pathname.replace(/\/[^/]*$/, '/') || targetUrl.origin + '/';
    const appOrigin = request.nextUrl.origin;
    if (/<head[\s>]/i.test(html)) {
      html = html.replace(/<head([^>]*)>/i, `<head$1><base href="${correctBase}">`);
    } else {
      html = `<head><base href="${correctBase}"></head>` + html;
    }

    // Remove link preload (solo se non allowScripts - altrimenti gli script ne hanno bisogno)
    if (!allowScripts) {
      html = html.replace(/<link[^>]*rel\s*=\s*["']preload["'][^>]*>/gi, '');
      html = html.replace(/<link[^>]*rel\s*=\s*["']modulepreload["'][^>]*>/gi, '');
    }

    // Remove event handlers (solo se non allowScripts - altrimenti la pagina ne ha bisogno)
    if (!allowScripts) {
      html = html.replace(/\s+on\w+=["'][^"']*["']/gi, '');
    }

    // Remove script tags only if not in preview mode (scripts=1 per pagine SPA che necessitano JS)
    if (!allowScripts) {
      html = html.replace(/<script[\s\S]*?<\/script>/gi, '');
      html = html.replace(/<script[^>]*\/>/gi, '');
      html = html.replace(/<link[^>]*as\s*=\s*["']script["'][^>]*>/gi, '');
    }

    // Inject scripts - proxy ALL cross-origin fetch/XHR/sendBeacon (not just main page origin)
    // Fixes CORS: cb/cdn-cgi/rum, trk.concealedqualify, db.*, etc. - pages call multiple domains
    // Preserves authorization headers for Supabase API calls
    // Also intercepts video/audio src for HLS streams
    const corsProxyScript = allowScripts ? `<script>
(function(){var A=window.__CRO_PROXY_API__;var O=window.__CRO_APP_ORIGIN__;var V=window.__CRO_VIDEO_API__;if(!A||!O)return;
function proxy(u){if(!u||typeof u!=='string')return null;if(u.indexOf(O)===0)return null;if(u.indexOf('http://')===0||u.indexOf('https://')===0)return A+'?url='+encodeURIComponent(u);return null;}
function proxyVideo(u){if(!u||typeof u!=='string')return null;if(u.indexOf(O)===0)return null;if(u.indexOf('http://')===0||u.indexOf('https://')===0)return V+'?url='+encodeURIComponent(u);return null;}
function extractAuthHeaders(h){var apikey=null,auth=null;if(!h)return{apikey:null,auth:null};if(h instanceof Headers){apikey=h.get('apikey');auth=h.get('Authorization');}else if(typeof h==='object'){apikey=h.apikey||h['apikey'];auth=h.Authorization||h['Authorization'];}return{apikey:apikey,auth:auth};}
var _f=window.fetch;window.fetch=function(u,o){var url=typeof u==='string'?u:(u&&u.url);var p=proxy(url);if(p&&o&&o.headers){var h=o.headers;var ah=extractAuthHeaders(h);var nh=h instanceof Headers?new Headers(h):(typeof h==='object'?Object.assign({},h):new Headers());if(ah.apikey){if(nh instanceof Headers)nh.set('x-proxy-apikey',ah.apikey);else nh['x-proxy-apikey']=ah.apikey;}if(ah.auth){if(nh instanceof Headers)nh.set('x-proxy-authorization',ah.auth);else nh['x-proxy-authorization']=ah.auth;}o.headers=nh;}if(p)return _f(p,o);return _f.apply(this,arguments);};
var X=window.XMLHttpRequest;window.XMLHttpRequest=function(){var x=new X();var _open=x.open;var _setRequestHeader=x.setRequestHeader;var apikey=null,auth=null;x.open=function(m,u){var p=proxy(u);_open.call(x,m,p||u);};x.setRequestHeader=function(n,v){if(n==='apikey'){apikey=v;_setRequestHeader.call(x,'x-proxy-apikey',v);}else if(n==='Authorization'){auth=v;_setRequestHeader.call(x,'x-proxy-authorization',v);}else _setRequestHeader.call(x,n,v);};return x;};
var _sb=navigator.sendBeacon;if(_sb){navigator.sendBeacon=function(u,d){var p=proxy(u);if(p){var opts={method:'POST',body:d,keepalive:true};_f(p,opts).catch(function(){});return true;}return _sb.call(navigator,u,d);};}
if(V){try{var vd=Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype,'src');if(vd&&vd.set){var _vs=vd.set;Object.defineProperty(HTMLMediaElement.prototype,'src',{set:function(v){var p=proxyVideo(v);_vs.call(this,p||v);},get:vd.get,configurable:true});}}catch(e){}try{var sd=Object.getOwnPropertyDescriptor(HTMLSourceElement.prototype,'src');if(sd&&sd.set){var _ss=sd.set;Object.defineProperty(HTMLSourceElement.prototype,'src',{set:function(v){var pv=(this.type&&this.type.indexOf('video')>=0)||/\\.m3u8|\\.ts|\\.mp4/i.test(v);var p=pv?proxyVideo(v):proxy(v);_ss.call(this,p||v);},get:sd.get,configurable:true});}}catch(e){}}
})();</script>` : '';
    // Blocca redirect (location.replace/assign) in anteprima per evitare che pagine navigano via
    // MA non bloccare history.pushState/replaceState - servono ai router SPA per funzionare!
    const redirectBlockerScript = allowScripts ? `<script>
(function(){if(window.parent===window)return;
window.location.replace=function(){};
window.location.assign=function(){};
})();</script>` : '';
    const muteScript = `<script>(function(){function m(e){if(e&&!e.muted){e.muted=true;e.volume=0;}}
function ma(){document.querySelectorAll('video,audio').forEach(m);}ma();
var o=new MutationObserver(ma);o.observe(document.documentElement,{childList:true,subtree:true});
setTimeout(ma,500);setTimeout(ma,1500);})();</script>`;
    // Block cdn-cgi, cloudflare, trk - override prototype to catch both setAttribute AND el.src= / el.href=
    const blockInjectScript = allowScripts ? `<script>
(function(){var bad=/cdn-cgi|cloudflareinsights|trk\\.concealedqualify/i;
var d=Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype,'src');if(d&&d.set){var _set=d.set;Object.defineProperty(HTMLScriptElement.prototype,'src',{set:function(v){if(v&&bad.test(v))return;_set.call(this,v);},get:d.get,configurable:true});}
var d2=Object.getOwnPropertyDescriptor(HTMLLinkElement.prototype,'href');if(d2&&d2.set){var _set2=d2.set;Object.defineProperty(HTMLLinkElement.prototype,'href',{set:function(v){if(v&&bad.test(v))return;_set2.call(this,v);},get:d2.get,configurable:true});}
})();</script>` : '';
    // Per SPA con 404: iniettare history.replaceState come PRIMO script nel <head>
    // PRIMA di tutti gli script dell'app - così il router legge il path corretto
    const pathScript = injectedPath ? `<script>(function(){try{history.replaceState(null,'','${injectedPath.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}');}catch(e){}})();</script>` : '';
    // CSS leggero: non rompe il layout, solo evita overflow hidden che nasconde contenuto
    const heightFixCSS = `<style id="cro-height-fix">html,body{overflow:visible!important;}</style>`;
    const heightReporterScript = `<script>
(function(){if(window.parent===window)return;
function report(){var h=Math.max(document.body?document.body.scrollHeight:0,document.documentElement?document.documentElement.scrollHeight:0);
if(h>50){window.parent.postMessage({type:'cro-page-height',height:h},'*');}}
window.addEventListener('load',function(){report();setTimeout(report,500);setTimeout(report,2000);setTimeout(report,5000);});
if(document.readyState==='complete'||document.readyState==='interactive'){setTimeout(report,300);}
})();</script>`;
    const allScripts = `${pathScript}${heightFixCSS}<script>window.__CRO_PROXY_ORIGIN__="${targetUrl.origin}";window.__CRO_PROXY_API__="${appOrigin}/api/proxy-fetch";window.__CRO_VIDEO_API__="${appOrigin}/api/video";window.__CRO_APP_ORIGIN__="${appOrigin}";</script>${blockInjectScript}${corsProxyScript}${redirectBlockerScript}${heightReporterScript}${muteScript}`;
    
    // Inietta TUTTI gli script (incluso pathScript) come prima cosa nel <head>
    html = html.replace(/<head([^>]*)>/i, `$&${allScripts}`);

    // Videos: SEMPRE muted (no audio) - anteprime devono partire senza audio
    html = html.replace(/<video([^>]*)>/gi, (match, attrs) => {
      let a = attrs;
      if (!/muted/i.test(a)) a += ' muted';
      if (!/autoplay/i.test(a)) a += ' autoplay';
      if (!/playsinline/i.test(a)) a += ' playsinline';
      return `<video${a}>`;
    });
    // Audio: sempre muted, no autoplay
    html = html.replace(/<audio([^>]*)>/gi, (match, attrs) => {
      let a = attrs;
      if (!/muted/i.test(a)) a += ' muted';
      return `<audio${a}>`;
    });

    // Rewrite relative URLs to absolute for CSS, images, links
    const origin = targetUrl.origin;
    const basePath = targetUrl.pathname.replace(/\/[^/]*$/, '/');

    // Helper to resolve relative URLs to absolute
    const toAbsolute = (ref: string): string => {
      if (!ref || ref.startsWith('data:') || ref.startsWith('mailto:') || ref.startsWith('#') || ref.startsWith('javascript:')) return ref;
      if (ref.startsWith('//')) return 'https:' + ref;
      if (ref.startsWith('http://') || ref.startsWith('https://')) return ref;
      if (ref.startsWith('/')) return origin + ref;
      return origin + basePath + ref;
    };

    // Helper to proxy a URL through our API to avoid CORS
    // Use absolute URL so base tag (pointing to source) doesn't break our proxy paths
    const proxyUrl = (absoluteUrl: string): string => {
      return `${appOrigin}/api/proxy-asset?url=${encodeURIComponent(absoluteUrl)}`;
    };

    // Helper to proxy video URLs through the video API (handles HLS .m3u8 manifests properly)
    const proxyVideoUrl = (absoluteUrl: string): string => {
      return `${appOrigin}/api/video?url=${encodeURIComponent(absoluteUrl)}`;
    };

    // Resolve then proxy
    const resolveAndProxy = (ref: string): string => {
      const abs = toAbsolute(ref);
      if (abs.startsWith('data:') || abs.startsWith('mailto:') || abs.startsWith('#') || abs.startsWith('javascript:')) return abs;
      return proxyUrl(abs);
    };

    // Rewrite href in <link> tags - proxy CSS e script (modulepreload, preload as=script/style)
    html = html.replace(/<link([^>]*?)href=["']([^"']+)["']/gi, (match, before, href) => {
      if (/rel=["']stylesheet["']/i.test(before) || /as=["']style["']/i.test(before) || /\.css/i.test(href)) {
        return `<link${before}href="${resolveAndProxy(href)}"`;
      }
      // Proxy script/modulepreload - evita CORS su quiz e SPA
      if (/rel=["']modulepreload["']/i.test(before) || /as=["']script["']/i.test(before) || /\.js/i.test(href)) {
        return `<link${before}href="${resolveAndProxy(href)}"`;
      }
      return `<link${before}href="${toAbsolute(href)}"`;
    });

    // Rewrite src in <script> tags - evita CORS su quiz e SPA (concealedqualify, ecc.)
    if (allowScripts) {
      html = html.replace(/<script([^>]*?)src=["']([^"']+)["']/gi, (match, before, src) => {
        if (src.startsWith('data:') || src.startsWith('javascript:')) return match;
        return `<script${before}src="${resolveAndProxy(src)}"`;
      });
    }

    // Rewrite src in <img> tags - proxy images (all types: jpg, png, webp, svg, gif, avif, etc.)
    html = html.replace(/<img([^>]*?)src=["']([^"']+)["']/gi, (match, before, src) => {
      return `<img${before}src="${resolveAndProxy(src)}"`;
    });

    // Rewrite srcset in <source> (picture element) - proxy images
    html = html.replace(/<source([^>]*?)srcset=["']([^"']+)["']/gi, (match, before, srcset) => {
      const resolved = srcset.split(',').map((entry: string) => {
        const parts = entry.trim().split(/\s+/);
        if (parts[0]) parts[0] = resolveAndProxy(parts[0]);
        return parts.join(' ');
      }).join(', ');
      return `<source${before}srcset="${resolved}"`;
    });

    // Rewrite src in <video> tags (direct video src) - use video proxy for HLS
    html = html.replace(/<video([^>]*?)src=["']([^"']+)["']/gi, (match, before, src) => {
      const absSrc = toAbsolute(src);
      if (absSrc.startsWith('data:')) return match;
      // HLS streams need video proxy to rewrite manifest URLs
      if (/\.m3u8/i.test(src)) {
        return `<video${before}src="${proxyVideoUrl(absSrc)}"`;
      }
      return `<video${before}src="${resolveAndProxy(src)}"`;
    });

    // Rewrite url() in inline styles and style tags - proxy fonts/bg images
    html = html.replace(/url\(["']?(?!data:)([^"')]+)["']?\)/gi, (match, ref) => {
      return `url("${resolveAndProxy(ref)}")`;
    });

    // Rewrite srcset
    html = html.replace(/srcset=["']([^"']+)["']/gi, (match, srcset) => {
      const resolved = srcset.split(',').map((entry: string) => {
        const parts = entry.trim().split(/\s+/);
        if (parts[0]) parts[0] = resolveAndProxy(parts[0]);
        return parts.join(' ');
      }).join(', ');
      return `srcset="${resolved}"`;
    });

    // Rewrite poster in <video> tags
    html = html.replace(/<video([^>]*?)poster=["']([^"']+)["']/gi, (match, before, poster) => {
      return `<video${before}poster="${resolveAndProxy(poster)}"`;
    });

    // Rewrite source src in <source> tags - use video proxy for HLS
    html = html.replace(/<source([^>]*?)src=["']([^"']+)["']/gi, (match, before, src) => {
      const absSrc = toAbsolute(src);
      if (absSrc.startsWith('data:')) return match;
      // HLS streams need video proxy to rewrite manifest URLs
      if (/\.m3u8/i.test(src) || /video/i.test(before)) {
        return `<source${before}src="${proxyVideoUrl(absSrc)}"`;
      }
      return `<source${before}src="${resolveAndProxy(src)}"`;
    });

    // NO base tag - all URLs are already rewritten to absolute or proxied
    // A base tag would break our /api/proxy-asset relative URLs

    // Return HTML - NO connect-src CSP: blocca fetch a clickbank/graphql e altre API, anteprime vuote
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Frame-Options': 'ALLOWALL',
        'Content-Security-Policy': "frame-ancestors 'self'",
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Proxy error:', error);
    // Fallback: redirect iframe all'URL diretto (timeout, network error, ecc.)
    if (!url) {
      return NextResponse.json(
        { error: `Failed to proxy page: ${error.message}` },
        { status: 500 }
      );
    }
    try {
      const targetUrl = new URL(url);
      const directUrl = targetUrl.toString().replace(/"/g, '&quot;');
      const fallbackHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"><meta http-equiv="refresh" content="0;url=${directUrl}"></head><body>Redirecting...</body></html>`;
      return new NextResponse(fallbackHtml, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'X-Frame-Options': 'ALLOWALL',
          'Cache-Control': 'no-store',
        },
      });
    } catch {
      return NextResponse.json(
        { error: `Failed to proxy page: ${error.message}` },
        { status: 500 }
      );
    }
  }
}
