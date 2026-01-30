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

    // Fetch the page
    const response = await fetch(targetUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': targetUrl.origin + '/',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch page: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    let html = await response.text();

    // Remove base tag - pages with wrong base may point images to our domain (404)
    html = html.replace(/<base[^>]*>/gi, '');

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

    // Inject scripts in ONE replace - ordine corretto: originVar -> corsProxy -> redirectBlocker -> mute
    // (ogni replace inserisce dopo <head>, quindi l'ultimo finirebbe primo - un solo replace evita il bug)
    const corsProxyScript = allowScripts ? `<script>
(function(){var O=window.__CRO_PROXY_ORIGIN__;var A=window.__CRO_PROXY_API__;if(!O||!A)return;
function proxy(u){if(!u||u.indexOf(O)!==0)return null;return A+'?url='+encodeURIComponent(u);}
var _f=window.fetch;window.fetch=function(u,o){var url=typeof u==='string'?u:(u&&u.url);var p=proxy(url);if(p)return _f(p,o);return _f.apply(this,arguments);};
var X=window.XMLHttpRequest;window.XMLHttpRequest=function(){var x=new X();var _open=x.open;x.open=function(m,u){var p=proxy(u);_open.call(x,m,p||u);};return x;};
})();</script>` : '';
    // Blocca redirect e history manipulation in anteprima - evita SecurityError replaceState e checkout che sparisce
    const redirectBlockerScript = allowScripts ? `<script>
(function(){if(window.parent===window)return;
window.location.replace=function(){};
window.location.assign=function(){};
try{
var _rs=history.replaceState;_ps=history.pushState;
history.replaceState=function(s,t,u){try{_rs.call(history,s,t,window.location.href);}catch(e){}};
history.pushState=function(s,t,u){try{_ps.call(history,s,t,window.location.href);}catch(e){}};
}catch(e){}
})();</script>` : '';
    const muteScript = `<script>(function(){function m(e){if(e&&!e.muted){e.muted=true;e.volume=0;}}
function ma(){document.querySelectorAll('video,audio').forEach(m);}ma();
var o=new MutationObserver(ma);o.observe(document.documentElement,{childList:true,subtree:true});
setTimeout(ma,500);setTimeout(ma,1500);})();</script>`;
    const allScripts = `<script>window.__CRO_PROXY_ORIGIN__="${targetUrl.origin}";window.__CRO_PROXY_API__="${appOrigin}/api/proxy-fetch";</script>${corsProxyScript}${redirectBlockerScript}${muteScript}`;
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

    // Resolve then proxy
    const resolveAndProxy = (ref: string): string => {
      const abs = toAbsolute(ref);
      if (abs.startsWith('data:') || abs.startsWith('mailto:') || abs.startsWith('#') || abs.startsWith('javascript:')) return abs;
      return proxyUrl(abs);
    };

    // Rewrite href in <link> tags (CSS) - proxy CSS files
    html = html.replace(/<link([^>]*?)href=["']([^"']+)["']/gi, (match, before, href) => {
      // Only proxy stylesheet links
      if (/rel=["']stylesheet["']/i.test(before) || /\.css/i.test(href)) {
        return `<link${before}href="${resolveAndProxy(href)}"`;
      }
      return `<link${before}href="${toAbsolute(href)}"`;
    });

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

    // Rewrite src in <video> tags (direct video src)
    html = html.replace(/<video([^>]*?)src=["']([^"']+)["']/gi, (match, before, src) => {
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

    // Rewrite source src in <source> tags
    html = html.replace(/<source([^>]*?)src=["']([^"']+)["']/gi, (match, before, src) => {
      return `<source${before}src="${resolveAndProxy(src)}"`;
    });

    // NO base tag - all URLs are already rewritten to absolute or proxied
    // A base tag would break our /api/proxy-asset relative URLs

    // Return HTML without X-Frame-Options
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Frame-Options': 'ALLOWALL',
        'Content-Security-Policy': "frame-ancestors 'self'",
        // Allow cross-origin resources
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: `Failed to proxy page: ${error.message}` },
      { status: 500 }
    );
  }
}
