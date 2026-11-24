// The site's languages and the words around every page (header, footer, language switcher).
//
// Adding a language: add an entry here, copy src/pages/en/ to src/pages/<code>/ and translate it.
// `pnpm build` then writes its pages under /<code>/, links every page to its translations
// (hreflang) and adds them to the sitemap. `pnpm lint` fails while a page is missing.

export const ORIGIN = 'https://2earl.com';

/** The first language is the default: its pages live at the root and are the x-default. */
export const LOCALES = [
  {
    code: 'en',
    name: 'English',
    ogLocale: 'en_US',
    login: 'https://login.2earl.com',
    words: {
      signIn: 'Sign in',
      legal: 'Legal',
      legalNav: 'Legal',
      language: 'Language',
      privacy: 'Privacy policy',
      terms: 'Terms of service',
      imprint: 'Imprint',
      security: 'Security',
    },
  },
  {
    code: 'tr',
    name: 'Türkçe',
    ogLocale: 'tr_TR',
    login: 'https://login.2earl.com/?lang=tr',
    words: {
      signIn: 'Giriş yap',
      legal: 'Hukuki',
      legalNav: 'Hukuki bilgiler',
      language: 'Dil',
      privacy: 'Gizlilik politikası',
      terms: 'Kullanım koşulları',
      imprint: 'Künye',
      security: 'Güvenlik',
    },
  },
];

/** Pages, by file name in src/pages/<locale>/; `index` is the start page. */
export const PAGES = ['index', 'privacy', 'terms', 'imprint', 'security', 'dpa', '404'];

/** Pages in the footer, in order. */
export const FOOTER = ['privacy', 'terms', 'imprint', 'security'];
