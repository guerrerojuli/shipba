import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function styleMarkdownHTML(htmlString: string) {
    const styles = {
        h1: 'font-size: 2.25rem; font-weight: 800; margin: 2rem 0 1.5rem; color: #1a1a1a; line-height: 1.2;',
        h2: 'font-size: 1.875rem; font-weight: 700; margin: 1.75rem 0 1.25rem; color: #1a1a1a; line-height: 1.3;',
        h3: 'font-size: 1.5rem; font-weight: 600; margin: 1.5rem 0 1rem; color: #1a1a1a; line-height: 1.4;',
        p: 'margin: 1.25rem 0; line-height: 1.75; color: #374151;',
        a: 'color: #2563eb; text-decoration: underline; hover:text-decoration: none;',
        ul: 'list-style-type: disc; margin: 1.25rem 0; padding-left: 2rem;',
        ol: 'list-style-type: decimal; margin: 1.25rem 0; padding-left: 2rem;',
        li: 'margin: 0.5rem 0; line-height: 1.75;',
        blockquote: 'border-left: 4px solid #e5e7eb; padding-left: 1rem; margin: 1.5rem 0; font-style: italic; color: #4b5563;',
        code: 'font-family: monospace; background-color: #f3f4f6; padding: 0.2rem 0.4rem; border-radius: 0.25rem;',
        pre: 'background-color: #f3f4f6; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; margin: 1.5rem 0;',
        table: 'width: 100%; border-collapse: collapse; margin: 1.5rem 0;',
        th: 'border: 1px solid #e5e7eb; padding: 0.75rem; background-color: #f3f4f6; text-align: left;',
        td: 'border: 1px solid #e5e7eb; padding: 0.75rem;',
    };

    if (typeof window === 'undefined') {
        return htmlString; // Retornar sin modificar si estamos en el servidor
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    Object.entries(styles).forEach(([tag, style]) => {
        const elements = doc.getElementsByTagName(tag);
        for (const element of elements) {
            const currentStyle = element.getAttribute('style') || '';
            element.setAttribute('style', `${currentStyle} ${style}`);
        }
    });

    return doc.documentElement.getElementsByTagName("body")[0].innerHTML;
}