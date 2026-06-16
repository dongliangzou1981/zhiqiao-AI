const iframeCsp =
  "default-src 'none'; img-src data: blob:; style-src 'unsafe-inline'; script-src 'unsafe-inline';";

export function buildCoursewareSandboxedHtml(html: string) {
  const cspMeta = `<meta http-equiv="Content-Security-Policy" content="${iframeCsp}">`;
  const baseStyle = `<style>
    html,body{width:100%;height:100%;margin:0;overflow:hidden}
    body{box-sizing:border-box}
    *,*::before,*::after{box-sizing:border-box}
    button{cursor:pointer}
    .deck,.stage,.slide{max-width:100%;max-height:100%}
    @media (max-width: 900px){body{font-size:14px}}
  </style>`;

  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head[^>]*>/i, (match) => `${match}${cspMeta}${baseStyle}`);
  }

  return `<!doctype html><html><head><meta charset="utf-8">${cspMeta}${baseStyle}</head><body>${html}</body></html>`;
}
