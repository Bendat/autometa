"use strict";(self.webpackChunk_autometa_documentation=self.webpackChunk_autometa_documentation||[]).push([[7438],{8480:(e,t,a)=>{a.d(t,{Z:()=>h});var l=a(9901),n=a(4517),r=a(8203),o=a(8631),i=a(10),s=a(3764);const c={sidebar:"sidebar_q5nl",sidebarItemTitle:"sidebarItemTitle_zHkp",sidebarItemList:"sidebarItemList_KmRa",sidebarItem:"sidebarItem_nd0B",sidebarItemLink:"sidebarItemLink_W3Bp",sidebarItemLinkActive:"sidebarItemLinkActive_g9l7"};function m(e){let{sidebar:t}=e;return l.createElement("aside",{className:"col col--3"},l.createElement("nav",{className:(0,n.Z)(c.sidebar,"thin-scrollbar"),"aria-label":(0,s.I)({id:"theme.blog.sidebar.navAriaLabel",message:"Blog recent posts navigation",description:"The ARIA label for recent posts in the blog sidebar"})},l.createElement("div",{className:(0,n.Z)(c.sidebarItemTitle,"margin-bottom--md")},t.title),l.createElement("ul",{className:(0,n.Z)(c.sidebarItemList,"clean-list")},t.items.map((e=>l.createElement("li",{key:e.permalink,className:c.sidebarItem},l.createElement(i.Z,{isNavLink:!0,to:e.permalink,className:c.sidebarItemLink,activeClassName:c.sidebarItemLinkActive},e.title)))))))}var u=a(3181);function d(e){let{sidebar:t}=e;return l.createElement("ul",{className:"menu__list"},t.items.map((e=>l.createElement("li",{key:e.permalink,className:"menu__list-item"},l.createElement(i.Z,{isNavLink:!0,to:e.permalink,className:"menu__link",activeClassName:"menu__link--active"},e.title)))))}function g(e){return l.createElement(u.Zo,{component:d,props:e})}function p(e){let{sidebar:t}=e;const a=(0,o.i)();return t?.items.length?"mobile"===a?l.createElement(g,{sidebar:t}):l.createElement(m,{sidebar:t}):null}function h(e){const{sidebar:t,toc:a,children:o,...i}=e,s=t&&t.items.length>0;return l.createElement(r.Z,i,l.createElement("div",{className:"container margin-vert--lg"},l.createElement("div",{className:"row"},l.createElement(p,{sidebar:t}),l.createElement("main",{className:(0,n.Z)("col",{"col--7":s,"col--9 col--offset-1":!s}),itemScope:!0,itemType:"http://schema.org/Blog"},o),a&&l.createElement("div",{className:"col col--2"},a))))}},6212:(e,t,a)=>{a.d(t,{Z:()=>B});var l=a(9901),n=a(4517),r=a(4306),o=a(1323);function i(e){let{children:t,className:a}=e;const{frontMatter:n,assets:i}=(0,r.C)(),{withBaseUrl:s}=(0,o.C)(),c=i.image??n.image;return l.createElement("article",{className:a,itemProp:"blogPost",itemScope:!0,itemType:"http://schema.org/BlogPosting"},c&&l.createElement("meta",{itemProp:"image",content:s(c,{absolute:!0})}),t)}var s=a(10);const c={title:"title_YHb4"};function m(e){let{className:t}=e;const{metadata:a,isBlogPostPage:o}=(0,r.C)(),{permalink:i,title:m}=a,u=o?"h1":"h2";return l.createElement(u,{className:(0,n.Z)(c.title,t),itemProp:"headline"},o?m:l.createElement(s.Z,{itemProp:"url",to:i},m))}var u=a(3764),d=a(3645);const g={container:"container_N6Rn"};function p(e){let{readingTime:t}=e;const a=function(){const{selectMessage:e}=(0,d.c)();return t=>{const a=Math.ceil(t);return e(a,(0,u.I)({id:"theme.blog.post.readingTime.plurals",description:'Pluralized label for "{readingTime} min read". Use as much plural forms (separated by "|") as your language support (see https://www.unicode.org/cldr/cldr-aux/charts/34/supplemental/language_plural_rules.html)',message:"One min read|{readingTime} min read"},{readingTime:a}))}}();return l.createElement(l.Fragment,null,a(t))}function h(e){let{date:t,formattedDate:a}=e;return l.createElement("time",{dateTime:t,itemProp:"datePublished"},a)}function f(){return l.createElement(l.Fragment,null," \xb7 ")}function E(e){let{className:t}=e;const{metadata:a}=(0,r.C)(),{date:o,formattedDate:i,readingTime:s}=a;return l.createElement("div",{className:(0,n.Z)(g.container,"margin-vert--md",t)},l.createElement(h,{date:o,formattedDate:i}),void 0!==s&&l.createElement(l.Fragment,null,l.createElement(f,null),l.createElement(p,{readingTime:s})))}function b(e){return e.href?l.createElement(s.Z,e):l.createElement(l.Fragment,null,e.children)}function v(e){let{author:t,className:a}=e;const{name:r,title:o,url:i,imageURL:s,email:c}=t,m=i||c&&`mailto:${c}`||void 0;return l.createElement("div",{className:(0,n.Z)("avatar margin-bottom--sm",a)},s&&l.createElement(b,{href:m,className:"avatar__photo-link"},l.createElement("img",{className:"avatar__photo",src:s,alt:r})),r&&l.createElement("div",{className:"avatar__intro",itemProp:"author",itemScope:!0,itemType:"https://schema.org/Person"},l.createElement("div",{className:"avatar__name"},l.createElement(b,{href:m,itemProp:"url"},l.createElement("span",{itemProp:"name"},r))),o&&l.createElement("small",{className:"avatar__subtitle",itemProp:"description"},o)))}const _={authorCol:"authorCol_aPxp",imageOnlyAuthorRow:"imageOnlyAuthorRow_j_7D",imageOnlyAuthorCol:"imageOnlyAuthorCol_gF4t"};function N(e){let{className:t}=e;const{metadata:{authors:a},assets:o}=(0,r.C)();if(0===a.length)return null;const i=a.every((e=>{let{name:t}=e;return!t}));return l.createElement("div",{className:(0,n.Z)("margin-top--md margin-bottom--sm",i?_.imageOnlyAuthorRow:"row",t)},a.map(((e,t)=>l.createElement("div",{className:(0,n.Z)(!i&&"col col--6",i?_.imageOnlyAuthorCol:_.authorCol),key:t},l.createElement(v,{author:{...e,imageURL:o.authorsImageUrls[t]??e.imageURL}})))))}function P(){return l.createElement("header",null,l.createElement(m,null),l.createElement(E,null),l.createElement(N,null))}var Z=a(8801),k=a(3170);function C(e){let{children:t,className:a}=e;const{isBlogPostPage:o}=(0,r.C)();return l.createElement("div",{id:o?Z.blogPostContainerID:void 0,className:(0,n.Z)("markdown",a),itemProp:"articleBody"},l.createElement(k.Z,null,t))}var I=a(7257),T=a(9438),y=a(4321);function w(){return l.createElement("b",null,l.createElement(u.Z,{id:"theme.blog.post.readMore",description:"The label used in blog post item excerpts to link to full blog posts"},"Read More"))}function F(e){const{blogPostTitle:t,...a}=e;return l.createElement(s.Z,(0,y.Z)({"aria-label":(0,u.I)({message:"Read more about {title}",id:"theme.blog.post.readMoreLabel",description:"The ARIA label for the link to full blog posts from excerpts"},{title:t})},a),l.createElement(w,null))}const L={blogPostFooterDetailsFull:"blogPostFooterDetailsFull_lX8U"};function R(){const{metadata:e,isBlogPostPage:t}=(0,r.C)(),{tags:a,title:o,editUrl:i,hasTruncateMarker:s}=e,c=!t&&s,m=a.length>0;return m||c||i?l.createElement("footer",{className:(0,n.Z)("row docusaurus-mt-lg",t&&L.blogPostFooterDetailsFull)},m&&l.createElement("div",{className:(0,n.Z)("col",{"col--9":c})},l.createElement(T.Z,{tags:a})),t&&i&&l.createElement("div",{className:"col margin-top--sm"},l.createElement(I.Z,{editUrl:i})),c&&l.createElement("div",{className:(0,n.Z)("col text--right",{"col--3":m})},l.createElement(F,{blogPostTitle:o,to:e.permalink}))):null}function B(e){let{children:t,className:a}=e;const o=function(){const{isBlogPostPage:e}=(0,r.C)();return e?void 0:"margin-bottom--xl"}();return l.createElement(i,{className:(0,n.Z)(o,a)},l.createElement(P,null),l.createElement(C,null,t),l.createElement(R,null))}},7257:(e,t,a)=>{a.d(t,{Z:()=>m});var l=a(9901),n=a(3764),r=a(5971),o=a(4321),i=a(4517);const s={iconEdit:"iconEdit_ihqR"};function c(e){let{className:t,...a}=e;return l.createElement("svg",(0,o.Z)({fill:"currentColor",height:"20",width:"20",viewBox:"0 0 40 40",className:(0,i.Z)(s.iconEdit,t),"aria-hidden":"true"},a),l.createElement("g",null,l.createElement("path",{d:"m34.5 11.7l-3 3.1-6.3-6.3 3.1-3q0.5-0.5 1.2-0.5t1.1 0.5l3.9 3.9q0.5 0.4 0.5 1.1t-0.5 1.2z m-29.5 17.1l18.4-18.5 6.3 6.3-18.4 18.4h-6.3v-6.2z"})))}function m(e){let{editUrl:t}=e;return l.createElement("a",{href:t,target:"_blank",rel:"noreferrer noopener",className:r.k.common.editThisPage},l.createElement(c,null),l.createElement(n.Z,{id:"theme.common.editThisPage",description:"The link label to edit the current page"},"Edit this page"))}},7612:(e,t,a)=>{a.d(t,{Z:()=>o});var l=a(9901),n=a(4517),r=a(10);function o(e){const{permalink:t,title:a,subLabel:o,isNext:i}=e;return l.createElement(r.Z,{className:(0,n.Z)("pagination-nav__link",i?"pagination-nav__link--next":"pagination-nav__link--prev"),to:t},o&&l.createElement("div",{className:"pagination-nav__sublabel"},o),l.createElement("div",{className:"pagination-nav__label"},a))}},4951:(e,t,a)=>{a.d(t,{Z:()=>i});var l=a(9901),n=a(4517),r=a(10);const o={tag:"tag_IfHO",tagRegular:"tagRegular_rHoh",tagWithCount:"tagWithCount_jOPl"};function i(e){let{permalink:t,label:a,count:i}=e;return l.createElement(r.Z,{href:t,className:(0,n.Z)(o.tag,i?o.tagWithCount:o.tagRegular)},a,i&&l.createElement("span",null,i))}},9438:(e,t,a)=>{a.d(t,{Z:()=>s});var l=a(9901),n=a(4517),r=a(3764),o=a(4951);const i={tags:"tags_MntW",tag:"tag_mz2K"};function s(e){let{tags:t}=e;return l.createElement(l.Fragment,null,l.createElement("b",null,l.createElement(r.Z,{id:"theme.tags.tagsListLabel",description:"The label alongside a tag list"},"Tags:")),l.createElement("ul",{className:(0,n.Z)(i.tags,"padding--none","margin-left--sm")},t.map((e=>{let{label:t,permalink:a}=e;return l.createElement("li",{key:a,className:i.tag},l.createElement(o.Z,{label:t,permalink:a}))}))))}},4306:(e,t,a)=>{a.d(t,{C:()=>i,n:()=>o});var l=a(9901),n=a(9697);const r=l.createContext(null);function o(e){let{children:t,content:a,isBlogPostPage:n=!1}=e;const o=function(e){let{content:t,isBlogPostPage:a}=e;return(0,l.useMemo)((()=>({metadata:t.metadata,frontMatter:t.frontMatter,assets:t.assets,toc:t.toc,isBlogPostPage:a})),[t,a])}({content:a,isBlogPostPage:n});return l.createElement(r.Provider,{value:o},t)}function i(){const e=(0,l.useContext)(r);if(null===e)throw new n.i6("BlogPostProvider");return e}},3645:(e,t,a)=>{a.d(t,{c:()=>c});var l=a(9901),n=a(3615);const r=["zero","one","two","few","many","other"];function o(e){return r.filter((t=>e.includes(t)))}const i={locale:"en",pluralForms:o(["one","other"]),select:e=>1===e?"one":"other"};function s(){const{i18n:{currentLocale:e}}=(0,n.Z)();return(0,l.useMemo)((()=>{try{return function(e){const t=new Intl.PluralRules(e);return{locale:e,pluralForms:o(t.resolvedOptions().pluralCategories),select:e=>t.select(e)}}(e)}catch(t){return console.error(`Failed to use Intl.PluralRules for locale "${e}".\nDocusaurus will fallback to the default (English) implementation.\nError: ${t.message}\n`),i}}),[e])}function c(){const e=s();return{selectMessage:(t,a)=>function(e,t,a){const l=e.split("|");if(1===l.length)return l[0];l.length>a.pluralForms.length&&console.error(`For locale=${a.locale}, a maximum of ${a.pluralForms.length} plural forms are expected (${a.pluralForms.join(",")}), but the message contains ${l.length}: ${e}`);const n=a.select(t),r=a.pluralForms.indexOf(n);return l[Math.min(r,l.length-1)]}(a,t,e)}}},4887:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.default=function(e,t){const{trailingSlash:a,baseUrl:l}=t;if(e.startsWith("#"))return e;if(void 0===a)return e;const[n]=e.split(/[#?]/),r="/"===n||n===l?n:(o=n,a?function(e){return e.endsWith("/")?e:`${e}/`}(o):function(e){return e.endsWith("/")?e.slice(0,-1):e}(o));var o;return e.replace(n,r)}},8801:function(e,t,a){var l=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(t,"__esModule",{value:!0}),t.applyTrailingSlash=t.blogPostContainerID=void 0,t.blogPostContainerID="post-content";var n=a(4887);Object.defineProperty(t,"applyTrailingSlash",{enumerable:!0,get:function(){return l(n).default}})}}]);