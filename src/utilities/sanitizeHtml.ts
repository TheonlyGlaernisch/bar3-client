const BLOCKED_TAGS = new Set([
  'script',
  'iframe',
  'object',
  'embed',
  'meta',
  'base',
  'link',
  'form',
  'input',
  'button',
  'textarea',
  'select',
]);

const URL_ATTRIBUTES = new Set(['href', 'src', 'xlink:href', 'srcdoc', 'action', 'formaction']);

function isUnsafeUrl(value: string): boolean {
  const normalized = value.replace(/[\u0000-\u001f\u007f\s]+/g, '').toLowerCase();
  return normalized.startsWith('javascript:')
    || normalized.startsWith('vbscript:')
    || normalized.startsWith('data:text/html')
    || normalized.startsWith('data:application');
}

function sanitizeStyle(value: string): string {
  return value
    .replace(/expression\s*\([^)]*\)/gi, '')
    .replace(/url\s*\(\s*["']?\s*javascript:[^)]*\)/gi, '')
    .replace(/behavior\s*:[^;]+;?/gi, '')
    .replace(/-moz-binding\s*:[^;]+;?/gi, '')
    .trim();
}

export function sanitizeHtml(input: string): string {
  if (!input) return '';

  const template = document.createElement('template');
  template.innerHTML = input;
  const elements = Array.from(template.content.querySelectorAll('*'));

  for (const element of elements) {
    const tagName = element.tagName.toLowerCase();
    if (BLOCKED_TAGS.has(tagName)) {
      element.remove();
      continue;
    }

    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value;

      if (name.startsWith('on')) {
        element.removeAttribute(attribute.name);
        continue;
      }

      if (name === 'style') {
        const cleanedStyle = sanitizeStyle(value);
        if (cleanedStyle) {
          element.setAttribute('style', cleanedStyle);
        } else {
          element.removeAttribute(attribute.name);
        }
        continue;
      }

      if (URL_ATTRIBUTES.has(name) && isUnsafeUrl(value)) {
        element.removeAttribute(attribute.name);
      }
    }
  }

  return template.innerHTML;
}
