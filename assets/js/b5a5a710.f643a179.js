"use strict";(self.webpackChunk_autometa_documentation=self.webpackChunk_autometa_documentation||[]).push([[7959],{4993:(e,t,n)=>{n.d(t,{Zo:()=>c,kt:()=>b});var r=n(2983);function a(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function l(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function o(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?l(Object(n),!0).forEach((function(t){a(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):l(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function i(e,t){if(null==e)return{};var n,r,a=function(e,t){if(null==e)return{};var n,r,a={},l=Object.keys(e);for(r=0;r<l.length;r++)n=l[r],t.indexOf(n)>=0||(a[n]=e[n]);return a}(e,t);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(e);for(r=0;r<l.length;r++)n=l[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(a[n]=e[n])}return a}var u=r.createContext({}),s=function(e){var t=r.useContext(u),n=t;return e&&(n="function"==typeof e?e(t):o(o({},t),e)),n},c=function(e){var t=s(e.components);return r.createElement(u.Provider,{value:t},e.children)},d="mdxType",p={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},m=r.forwardRef((function(e,t){var n=e.components,a=e.mdxType,l=e.originalType,u=e.parentName,c=i(e,["components","mdxType","originalType","parentName"]),d=s(n),m=a,b=d["".concat(u,".").concat(m)]||d[m]||p[m]||l;return n?r.createElement(b,o(o({ref:t},c),{},{components:n})):r.createElement(b,o({ref:t},c))}));function b(e,t){var n=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var l=n.length,o=new Array(l);o[0]=m;var i={};for(var u in t)hasOwnProperty.call(t,u)&&(i[u]=t[u]);i.originalType=e,i[d]="string"==typeof e?e:a,o[1]=i;for(var s=2;s<l;s++)o[s]=n[s];return r.createElement.apply(null,o)}return r.createElement.apply(null,n)}m.displayName="MDXCreateElement"},8140:(e,t,n)=>{n.d(t,{Z:()=>o});var r=n(2983),a=n(4517);const l={tabItem:"tabItem_jUsi"};function o(e){let{children:t,hidden:n,className:o}=e;return r.createElement("div",{role:"tabpanel",className:(0,a.Z)(l.tabItem,o),hidden:n},t)}},6895:(e,t,n)=>{n.d(t,{Z:()=>w});var r=n(3050),a=n(2983),l=n(4517),o=n(4760),i=n(3729),u=n(4255),s=n(291),c=n(9032);function d(e){return function(e){return a.Children.map(e,(e=>{if(!e||(0,a.isValidElement)(e)&&function(e){const{props:t}=e;return!!t&&"object"==typeof t&&"value"in t}(e))return e;throw new Error(`Docusaurus error: Bad <Tabs> child <${"string"==typeof e.type?e.type:e.type.name}>: all children of the <Tabs> component should be <TabItem>, and every <TabItem> should have a unique "value" prop.`)}))?.filter(Boolean)??[]}(e).map((e=>{let{props:{value:t,label:n,attributes:r,default:a}}=e;return{value:t,label:n,attributes:r,default:a}}))}function p(e){const{values:t,children:n}=e;return(0,a.useMemo)((()=>{const e=t??d(n);return function(e){const t=(0,s.l)(e,((e,t)=>e.value===t.value));if(t.length>0)throw new Error(`Docusaurus error: Duplicate values "${t.map((e=>e.value)).join(", ")}" found in <Tabs>. Every value needs to be unique.`)}(e),e}),[t,n])}function m(e){let{value:t,tabValues:n}=e;return n.some((e=>e.value===t))}function b(e){let{queryString:t=!1,groupId:n}=e;const r=(0,i.k6)(),l=function(e){let{queryString:t=!1,groupId:n}=e;if("string"==typeof t)return t;if(!1===t)return null;if(!0===t&&!n)throw new Error('Docusaurus error: The <Tabs> component groupId prop is required if queryString=true, because this value is used as the search param name. You can also provide an explicit value such as queryString="my-search-param".');return n??null}({queryString:t,groupId:n});return[(0,u._X)(l),(0,a.useCallback)((e=>{if(!l)return;const t=new URLSearchParams(r.location.search);t.set(l,e),r.replace({...r.location,search:t.toString()})}),[l,r])]}function f(e){const{defaultValue:t,queryString:n=!1,groupId:r}=e,l=p(e),[o,i]=(0,a.useState)((()=>function(e){let{defaultValue:t,tabValues:n}=e;if(0===n.length)throw new Error("Docusaurus error: the <Tabs> component requires at least one <TabItem> children component");if(t){if(!m({value:t,tabValues:n}))throw new Error(`Docusaurus error: The <Tabs> has a defaultValue "${t}" but none of its children has the corresponding value. Available values are: ${n.map((e=>e.value)).join(", ")}. If you intend to show no default tab, use defaultValue={null} instead.`);return t}const r=n.find((e=>e.default))??n[0];if(!r)throw new Error("Unexpected error: 0 tabValues");return r.value}({defaultValue:t,tabValues:l}))),[u,s]=b({queryString:n,groupId:r}),[d,f]=function(e){let{groupId:t}=e;const n=function(e){return e?`docusaurus.tab.${e}`:null}(t),[r,l]=(0,c.Nk)(n);return[r,(0,a.useCallback)((e=>{n&&l.set(e)}),[n,l])]}({groupId:r}),h=(()=>{const e=u??d;return m({value:e,tabValues:l})?e:null})();(0,a.useLayoutEffect)((()=>{h&&i(h)}),[h]);return{selectedValue:o,selectValue:(0,a.useCallback)((e=>{if(!m({value:e,tabValues:l}))throw new Error(`Can't select invalid tab value=${e}`);i(e),s(e),f(e)}),[s,f,l]),tabValues:l}}var h=n(8448);const y={tabList:"tabList_knRu",tabItem:"tabItem_nppw"};function g(e){let{className:t,block:n,selectedValue:i,selectValue:u,tabValues:s}=e;const c=[],{blockElementScrollPositionUntilNextRender:d}=(0,o.o5)(),p=e=>{const t=e.currentTarget,n=c.indexOf(t),r=s[n].value;r!==i&&(d(t),u(r))},m=e=>{let t=null;switch(e.key){case"Enter":p(e);break;case"ArrowRight":{const n=c.indexOf(e.currentTarget)+1;t=c[n]??c[0];break}case"ArrowLeft":{const n=c.indexOf(e.currentTarget)-1;t=c[n]??c[c.length-1];break}}t?.focus()};return a.createElement("ul",{role:"tablist","aria-orientation":"horizontal",className:(0,l.Z)("tabs",{"tabs--block":n},t)},s.map((e=>{let{value:t,label:n,attributes:o}=e;return a.createElement("li",(0,r.Z)({role:"tab",tabIndex:i===t?0:-1,"aria-selected":i===t,key:t,ref:e=>c.push(e),onKeyDown:m,onClick:p},o,{className:(0,l.Z)("tabs__item",y.tabItem,o?.className,{"tabs__item--active":i===t})}),n??t)})))}function v(e){let{lazy:t,children:n,selectedValue:r}=e;const l=(Array.isArray(n)?n:[n]).filter(Boolean);if(t){const e=l.find((e=>e.props.value===r));return e?(0,a.cloneElement)(e,{className:"margin-top--md"}):null}return a.createElement("div",{className:"margin-top--md"},l.map(((e,t)=>(0,a.cloneElement)(e,{key:t,hidden:e.props.value!==r}))))}function k(e){const t=f(e);return a.createElement("div",{className:(0,l.Z)("tabs-container",y.tabList)},a.createElement(g,(0,r.Z)({},e,t)),a.createElement(v,(0,r.Z)({},e,t)))}function w(e){const t=(0,h.Z)();return a.createElement(k,(0,r.Z)({key:String(t)},e))}},8067:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>c,contentTitle:()=>u,default:()=>b,frontMatter:()=>i,metadata:()=>s,toc:()=>d});var r=n(3050),a=(n(2983),n(4993)),l=n(6895),o=n(8140);const i={},u="DTO and Builder Pattern",s={unversionedId:"libraries/dto-builder/intro",id:"libraries/dto-builder/intro",title:"DTO and Builder Pattern",description:"This library allows defining DTO classes with decoratated properties.",source:"@site/docs/libraries/dto-builder/intro.mdx",sourceDirName:"libraries/dto-builder",slug:"/libraries/dto-builder/intro",permalink:"/autometa/docs/libraries/dto-builder/intro",draft:!1,editUrl:"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/docs/libraries/dto-builder/intro.mdx",tags:[],version:"current",frontMatter:{}},c={},d=[{value:"Installation",id:"installation",level:2},{value:"Use",id:"use",level:2},{value:"Creating a DTO",id:"creating-a-dto",level:3},{value:"Creating a builder",id:"creating-a-builder",level:3},{value:"Extending Interfaces",id:"extending-interfaces",level:2},{value:"Nesting DTOs",id:"nesting-dtos",level:2}],p={toc:d},m="wrapper";function b(e){let{components:t,...n}=e;return(0,a.kt)(m,(0,r.Z)({},p,n,{components:t,mdxType:"MDXLayout"}),(0,a.kt)("h1",{id:"dto-and-builder-pattern"},"DTO and Builder Pattern"),(0,a.kt)("p",null,"This library allows defining DTO classes with decoratated properties."),(0,a.kt)("admonition",{type:"caution"},(0,a.kt)("p",{parentName:"admonition"},"This library requires experimental decorators and a reflect polyfill\nlike ",(0,a.kt)("a",{parentName:"p",href:"https://www.npmjs.com/package/reflect-metadata"},"reflect-metadata"))),(0,a.kt)("h2",{id:"installation"},"Installation"),(0,a.kt)(l.Z,{mdxType:"Tabs"},(0,a.kt)(o.Z,{value:"npm",label:"NPM",mdxType:"TabItem"},(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre"},"npm i -D @autometa/dto-builer\n"))),(0,a.kt)(o.Z,{value:"yarn",label:"YARN",mdxType:"TabItem"},(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre"},"yarn add -D @autometa/dto-builer\n"))),(0,a.kt)(o.Z,{value:"pnpm",label:"PNPM",mdxType:"TabItem"},(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre"},"pnpm add -D @autometa/dto-builer\n")))),(0,a.kt)("h2",{id:"use"},"Use"),(0,a.kt)("h3",{id:"creating-a-dto"},"Creating a DTO"),(0,a.kt)("p",null,"To create a DTO, simply create a class which matches the data type your\nrepresenting. Then, decorate its properties with the ",(0,a.kt)("inlineCode",{parentName:"p"},"@Property")," decorator."),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts"},'import { Property } from "@autometa/dto-builder";\n\nexport class UserDto {\n  @Property\n  id: number;\n  @Property\n  name: string;\n  @Property\n  age: number;\n}\n')),(0,a.kt)("h3",{id:"creating-a-builder"},"Creating a builder"),(0,a.kt)("p",null,"Now that we have a DTO, we can make a builder for it. Simply pass\nyour DTO class prototype to the ",(0,a.kt)("inlineCode",{parentName:"p"},"Builder")," function. It will return a new\nclass whos interface matches the DTO, but with functions accepting a value\ninstead of raw properties."),(0,a.kt)("p",null,"The builder functions are compile-time type safe but do no\nrun time validation."),(0,a.kt)("p",null,"If the ",(0,a.kt)("inlineCode",{parentName:"p"},"class validator")," package is installed, the DTO will be validated on build. This can be bypassed by passing ",(0,a.kt)("inlineCode",{parentName:"p"},"false")," to the build method"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts"},'import { Builder } from "@autometa/dto-builder";\nimport { UserDto } from "./user-dto";\n\nclass UserBuilder extends Builder(UserDto) {}\n\nconst userBuilder = new UserBuilder();\nuserBuilder.id(1).name("bob").age(23);\n// methods are type safe\n// -------------\n// error       |\n//             V\nuserBuilder.id("1").name("bob").age(23);\n\n// Bypass\nuserBuilder\n  .id("1" as unknown as number)\n  .name("bob")\n  .age(23);\n')),(0,a.kt)("p",null,"You can also pass in an already existing DTO and build it\nfurther."),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts"},"const cachedUser = new UserDto();\nconst userBuilder = new UserBuilder(cachedUser);\n")),(0,a.kt)("h1",{id:"default-values"},"Default Values"),(0,a.kt)("p",null,"You can pass a value into the DTO decorators to provide a default value.\nThe default value will be injected by the Builder class."),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts"},'import { DTO } from "@autometa/dto-builder";\n\nexport class UserDto {\n  @DTO.value(100)\n  id: number;\n  @DTO.factory(() => "paul")\n  name: string;\n  @DTO.value(20)\n  age: number;\n  @DTO.date("2020-01-01")\n  created: Date;\n}\n\nexport class UserBuilder extends Builder(UserDto) {}\n\nconst user = new UserBuilder().build();\n\nconsole.log(user.id === 100); // true\nconsole.log(user.name === "paul"); // true\nconsole.log(user.age === 20); // true\n')),(0,a.kt)("h2",{id:"extending-interfaces"},"Extending Interfaces"),(0,a.kt)("p",null,'It may be the case you already have interfaces defined and don\'t want\nto redeclare each property to "implement" it. You can use the ',(0,a.kt)("inlineCode",{parentName:"p"},"DTO"),'\nfunction to "extend" an interface without redeclarations. Note,\nthese properties will be ',(0,a.kt)("inlineCode",{parentName:"p"},"undefined")," on the dto and will not appear\nin ",(0,a.kt)("inlineCode",{parentName:"p"},"Object.keys"),", unless a default value or factory is defined for them and they\nand constructed via a builder."),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts"},"export interface MyInterface {\n  id: number;\n  name: string;\n}\n\nexport class MyDto extends DTO<MyInterface>() {}\n\n// or with a default value\n\nexport class MyDto extends DTO<MyInterface>() {\n  @DTO.value(1)\n  id: number;\n}\n")),(0,a.kt)("p",null,"This will satisfy the compiler that the DTO implements the interface correctly."),(0,a.kt)("h2",{id:"nesting-dtos"},"Nesting DTOs"),(0,a.kt)("p",null,"For complex classes with nested classes or objects it is adiviseable to use a type\nor interface rather than a Dto type for the property type."),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts"},"// prefer not\nclass InnerDto {\n  value: number;\n}\n\nclass OuterDto {\n  inner: InnerDto;\n}\n\ninterface Inner {\n  value: number;\n}\n\nclass InnerDto implements Inner {\n  value: number;\n}\n\n// alternatively, extend the interface with `DTO` to avoid\n// redeclaring properties\nclass InnerDto extends DTO<Inner> {}\n\nclass OuterDto {\n  @DTO.dto(InnerDto)\n  inner: Inner;\n}\n")),(0,a.kt)("p",null,"To make a DTO available for nesting, pass its prototype to the Property decorator\nas its default value."),(0,a.kt)("p",null,":::hint\nThe value passed to the Property decorator for a nested DTO is the ",(0,a.kt)("em",{parentName:"p"},"class"),"\nof the DTO itself (not an instance created with new ...())\n:::"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts"},"\n// prefer\ninterface Inner {\n    value: number\n}\n\nclass InnerDto {\n  @DTO.value(1)\n  value: number;\n}\n\nclass OuterDto {\n\n  @DTO.dto(InnerDto)\n  inner: Inner;\n}\n\nconst Outer = new OuterBuilder().build()\n\nconsole.log(outer.inner instanceOf InnerDto); // true\nconsole.log(outer.inner.value === 1); // true\n")),(0,a.kt)("p",null,"You can also create a unique dto with default values by calling the static ",(0,a.kt)("inlineCode",{parentName:"p"},"default"),"\nmethod on your builder"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts"},"const Outer = OuterBuilder.default();\n")),(0,a.kt)("p",null,"For many tests, valid default values may be all you need on your dto. If\nyou wish to make further edits you can pass the instance to a builder later"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts"},"new OuterBuilder(Outer).inner(new InnerBuilder().value(1).build());\n")),(0,a.kt)("p",null,"Note that this will mutate the original dto. You do not need to reassign it or\neven ",(0,a.kt)("inlineCode",{parentName:"p"},"build")," it."),(0,a.kt)("h1",{id:"dto-from-raw-object"},"DTO From Raw Object"),(0,a.kt)("p",null,"Sometimes it's necessary to convert a raw object into a DTO. This can be achieved by\ncalling ",(0,a.kt)("inlineCode",{parentName:"p"},"fromRaw")," on the Builder class, passing it the raw object."),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts"},"const raw = { Outer: { inner: { value: 1 } } };\nconst dto = OuterBuilder.fromRaw(raw);\n\nexpect(dto).toBeInstanceOf(Outer);\n")))}b.isMDXComponent=!0}}]);