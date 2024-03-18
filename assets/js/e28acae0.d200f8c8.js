"use strict";(self.webpackChunk_autometa_documentation=self.webpackChunk_autometa_documentation||[]).push([[1968],{4993:(e,n,t)=>{t.d(n,{Zo:()=>d,kt:()=>k});var a=t(2983);function i(e,n,t){return n in e?Object.defineProperty(e,n,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[n]=t,e}function r(e,n){var t=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);n&&(a=a.filter((function(n){return Object.getOwnPropertyDescriptor(e,n).enumerable}))),t.push.apply(t,a)}return t}function o(e){for(var n=1;n<arguments.length;n++){var t=null!=arguments[n]?arguments[n]:{};n%2?r(Object(t),!0).forEach((function(n){i(e,n,t[n])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):r(Object(t)).forEach((function(n){Object.defineProperty(e,n,Object.getOwnPropertyDescriptor(t,n))}))}return e}function s(e,n){if(null==e)return{};var t,a,i=function(e,n){if(null==e)return{};var t,a,i={},r=Object.keys(e);for(a=0;a<r.length;a++)t=r[a],n.indexOf(t)>=0||(i[t]=e[t]);return i}(e,n);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);for(a=0;a<r.length;a++)t=r[a],n.indexOf(t)>=0||Object.prototype.propertyIsEnumerable.call(e,t)&&(i[t]=e[t])}return i}var l=a.createContext({}),c=function(e){var n=a.useContext(l),t=n;return e&&(t="function"==typeof e?e(n):o(o({},n),e)),t},d=function(e){var n=c(e.components);return a.createElement(l.Provider,{value:n},e.children)},p="mdxType",u={inlineCode:"code",wrapper:function(e){var n=e.children;return a.createElement(a.Fragment,{},n)}},m=a.forwardRef((function(e,n){var t=e.components,i=e.mdxType,r=e.originalType,l=e.parentName,d=s(e,["components","mdxType","originalType","parentName"]),p=c(t),m=i,k=p["".concat(l,".").concat(m)]||p[m]||u[m]||r;return t?a.createElement(k,o(o({ref:n},d),{},{components:t})):a.createElement(k,o({ref:n},d))}));function k(e,n){var t=arguments,i=n&&n.mdxType;if("string"==typeof e||i){var r=t.length,o=new Array(r);o[0]=m;var s={};for(var l in n)hasOwnProperty.call(n,l)&&(s[l]=n[l]);s.originalType=e,s[p]="string"==typeof e?e:i,o[1]=s;for(var c=2;c<r;c++)o[c]=t[c];return a.createElement.apply(null,o)}return a.createElement.apply(null,t)}m.displayName="MDXCreateElement"},374:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>l,contentTitle:()=>o,default:()=>u,frontMatter:()=>r,metadata:()=>s,toc:()=>c});var a=t(3050),i=(t(2983),t(4993));const r={sidebar_position:5},o="Dependency Injection",s={unversionedId:"cucumber/test_runner/dependency_injection",id:"cucumber/test_runner/dependency_injection",title:"Dependency Injection",description:"Introduction",source:"@site/docs/cucumber/test_runner/dependency_injection.mdx",sourceDirName:"cucumber/test_runner",slug:"/cucumber/test_runner/dependency_injection",permalink:"/autometa/docs/cucumber/test_runner/dependency_injection",draft:!1,editUrl:"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/docs/cucumber/test_runner/dependency_injection.mdx",tags:[],version:"current",sidebarPosition:5,frontMatter:{sidebar_position:5},sidebar:"cucumberRunnerBar",previous:{title:"Cucumber Expressions",permalink:"/autometa/docs/cucumber/test_runner/cucumber_expressions"},next:{title:"Phrases",permalink:"/autometa/docs/cucumber/test_runner/phrases"}},l={},c=[{value:"Introduction",id:"introduction",level:2},{value:"Dependencies",id:"dependencies",level:2},{value:"Constructor Injection",id:"constructor-injection",level:2},{value:"Interacting with a Container",id:"interacting-with-a-container",level:2},{value:"Dynamically adding dependencies",id:"dynamically-adding-dependencies",level:2},{value:"Registration methods",id:"registration-methods",level:3},{value:"Registering values outside of test flow",id:"registering-values-outside-of-test-flow",level:2},{value:"Tokens",id:"tokens",level:2}],d={toc:c},p="wrapper";function u(e){let{components:n,...t}=e;return(0,i.kt)(p,(0,a.Z)({},d,t,{components:n,mdxType:"MDXLayout"}),(0,i.kt)("h1",{id:"dependency-injection"},"Dependency Injection"),(0,i.kt)("h2",{id:"introduction"},"Introduction"),(0,i.kt)("p",null,"Autometa supports the dependency injection pattern, which it uses to\nautomatically assemble complex relationships between, in particular,\nclasses."),(0,i.kt)("p",null,"A class can be marked as injectable using the ",(0,i.kt)("inlineCode",{parentName:"p"},"Fixture")," decorator:"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-ts"},"@Fixture()\nclass Foo {}\n")),(0,i.kt)("p",null,"By default, fixtures are marked as ",(0,i.kt)("inlineCode",{parentName:"p"},"Cached"),", meaning that a single instance\nis shared between all dependants. This can be changed by passing and\nInjection Scope, of which there are ",(0,i.kt)("inlineCode",{parentName:"p"},"Cached"),", as discussed, ",(0,i.kt)("inlineCode",{parentName:"p"},"Transient"),", and\n",(0,i.kt)("inlineCode",{parentName:"p"},"Singleton"),"."),(0,i.kt)("p",null,"A transient dependency is never cached. Each dependant property\nwill be instantiated with a new instance of the transient dependency."),(0,i.kt)("p",null,"A cached depenenency is cached for the lifetime of the test container. A new Test container\nis created for each Scenario being tested. Once instantiated, that cached instance will\nbe used in all other dependant properties. However, a new instance is created for each\nnew Scenario and cannot be shared between them"),(0,i.kt)("p",null,"A singleton dependency behaves similar to a cached dependency, except that\nthe instance created is reused across all test containers. This means for each ",(0,i.kt)("inlineCode",{parentName:"p"},"Feature"),"\nfile, only one copy of this dependency will exist across all test scenarios."),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-ts"},"@Fixture(InjectionScope.Singleton)\nclass SingletonFoo {}\n\n@Fixture(InjectionScope.Transient)\nclass TransientFoo {}\n")),(0,i.kt)("h2",{id:"dependencies"},"Dependencies"),(0,i.kt)("p",null,"Dependencies are injected into a class using one of the ",(0,i.kt)("inlineCode",{parentName:"p"},"Inject")," decorators.\nThere are presently 3 such decorators:"),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"Inject.class")," - Injects an instance of a class into the property. If the class is marked singleton or cached, the existing instance will be reused."),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"Inject.factory")," - Accepts a factory function whose return value will be injected into the property."),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"Inject.value")," - Injects a literal value, such as a string, number, array or anonymous object.")),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-ts"},'@Fixture()\nclass Foo {\n  @Inject.class(Bar)\n  bar: Bar;\n\n  @Inject.factory(() => new Baz())\n  baz: Baz;\n\n  @Inject.value("Hello World")\n  message: string;\n}\n')),(0,i.kt)("h2",{id:"constructor-injection"},"Constructor Injection"),(0,i.kt)("p",null,"Autometa also supports constructor injection. This allows you to describe\na constructor to behave as you wish."),(0,i.kt)("p",null,"To match the constructor to it's dependencies, the ",(0,i.kt)("inlineCode",{parentName:"p"},"Constructor")," decorator\nmay be used. This decorator accepts a list of fixture classes or tokens. The order\nof this list must match the order of the constructor arguments."),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-ts"},'@Fixture()\n@Constructor(Bar, Baz, Token("message"))\nclass Foo {\n  constructor(bar: Bar, baz: Baz, message: string) {}\n}\n')),(0,i.kt)("h2",{id:"interacting-with-a-container"},"Interacting with a Container"),(0,i.kt)("p",null,"The container is available in Hooks and Step Definitions through the app,\nwhere it is attached as the ",(0,i.kt)("inlineCode",{parentName:"p"},"di")," property. It can be used to register\nnew dependencies without relying on the ",(0,i.kt)("inlineCode",{parentName:"p"},"@Fixture")," syntax. Note that\nfixtures have already been constructed at this point, so dependencies\ndefined here will not be available through static injection via decorators\nif that class is instantiated before the new dependency is registered."),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-ts"},'Before("I register a value", async (app) => {\n  const asyncData = await app.myClient.getAsyncData();\n  app.di.registerValue(Token("asyncData"), asyncData);\n});\n\nAfter("I use the registered value", (app) => {\n  const asyncData = app.di.get(Token("asyncData"));\n});\n')),(0,i.kt)("h2",{id:"dynamically-adding-dependencies"},"Dynamically adding dependencies"),(0,i.kt)("p",null,"Dependencies can be defined or accessed during test execution using the ",(0,i.kt)("inlineCode",{parentName:"p"},"app.di")," property. This property\nallows you to define types or singleton values to be injected."),(0,i.kt)("admonition",{type:"note"},(0,i.kt)("p",{parentName:"admonition"},"A dependency can only be used in constructors if it is defined before the constructed class is instantiated. That\nmeans that a dependecy defined in a ",(0,i.kt)("inlineCode",{parentName:"p"},"Setup")," hook is not available as a constructor argument to other ",(0,i.kt)("inlineCode",{parentName:"p"},"Setup")," hooks,\nand a dependency defined in a ",(0,i.kt)("inlineCode",{parentName:"p"},"Before")," or step (",(0,i.kt)("inlineCode",{parentName:"p"},"Given"),", ",(0,i.kt)("inlineCode",{parentName:"p"},"When"),", ",(0,i.kt)("inlineCode",{parentName:"p"},"Then"),") definition is not available as a constructor argument\nto that, or other, scenarios as constructor parameters, because by the time they are defined, all (or almost all) classes have already\nbeen instantiated."),(0,i.kt)("p",{parentName:"admonition"},"i.e calling ",(0,i.kt)("inlineCode",{parentName:"p"},"app.di.register")," in a ",(0,i.kt)("inlineCode",{parentName:"p"},"Setup")," hook cannot be used to construct other Setup hook scope classes, but will be available to classes\nin the same feature file. Similarly, calling ",(0,i.kt)("inlineCode",{parentName:"p"},"app.di.register")," in a ",(0,i.kt)("inlineCode",{parentName:"p"},"Before")," hook will not be available to the constructor of the\nscenario, but will be available to the scenario itself via ",(0,i.kt)("inlineCode",{parentName:"p"},"app.di.get"),"."),(0,i.kt)("pre",{parentName:"admonition"},(0,i.kt)("code",{parentName:"pre",className:"language-ts"},'// setup.hooks.ts\nSetup("I register a value", async (app) => {\n  app.di.registerSingletonValue(Token(\'my token\'), "Hello World");\n});\n\n// my-class.ts\n@Fixture()\n@Constructor(Token(\'my token\'))\nclass MyClass {\n  constructor(myToken: string) {\n    console.log(myToken); // "Hello World"\n  }\n}\n\n// before.hooks.ts\n\nBefore("I use the registered value", async (app) => {\n  const myToken = app.di.registerSingleton(MyClass, MyClass);\n});\n\n// my-class.ts\n@Fixture()\n@Constructor(Token(\'my token\'), MyClass)\nclass MyClass {\n  /**\n   * \'myToken\' will be injected with the value "Hello World"\n   * \'myClass\' will fail to be injected, as it was already created before the dependency was defined\n   */\n  constructor(myToken: string, myClass: MyClass) {\n    console.log(myToken); // "Hello World"\n    console.log(myClass); // undefined or error thrown\n  }\n}\n'))),(0,i.kt)("admonition",{type:"info"},(0,i.kt)("p",{parentName:"admonition"},"The ",(0,i.kt)("inlineCode",{parentName:"p"},"Token")," function is available from ",(0,i.kt)("inlineCode",{parentName:"p"},"@autometa/injection")," which will be accessible when ",(0,i.kt)("inlineCode",{parentName:"p"},"@autometa/runner")," is installed.")),(0,i.kt)("p",null,"A dynamic dependency can always be accessed via ",(0,i.kt)("inlineCode",{parentName:"p"},"app.di.get"),", provided it was performed before any attempt to access it.\nI.e, as long as hooks that depenend on it are executed after the defining hook, it is accessible;"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-ts"},'Before("I register a value", async (app) => {\n  app.di.get(MyDynamicClass, MyDynamicClass); // fails, as no value has been registered\n});\n\nBefore("I register a value", async (app) => {\n  app.di.registerSingletonValue(MyDynamicClass, new MyDynamicClass());\n});\n\nBefore("I use the registered value", async (app) => {\n  const myDynamicClass = app.di.get(MyDynamicClass, MyDynamicClass); // succeeds\n});\n')),(0,i.kt)("h3",{id:"registration-methods"},"Registration methods"),(0,i.kt)("p",null,"The ",(0,i.kt)("inlineCode",{parentName:"p"},"di")," property supports the following methods (and/or overloads)"),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"registerCached")," - Registers a class as a cached dependency",(0,i.kt)("ul",{parentName:"li"},(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"registerCached(Token('myToken'), MyClass)")),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"registerCached(MyClass, MyClass)")))),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"registerSingleton")," - Registers a class as a singleton dependency",(0,i.kt)("ul",{parentName:"li"},(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"registerSingleton(Token('myToken'), MyClass)")),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"registerSingleton(MyClass, MyClass)")))),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"registerTransient")," - Registers a class as a transient dependency",(0,i.kt)("ul",{parentName:"li"},(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"registerTransient(Token('myToken'), MyClass)")),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"registerTransient(MyClass, MyClass)")))),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"registerSingletonValue")," - Registers a value as a singleton dependency",(0,i.kt)("ul",{parentName:"li"},(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"registerSingletonValue(Token('myToken'), \"Hello World\")")),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"registerSingletonValue(MyClass, new MyClass())"))))),(0,i.kt)("h2",{id:"registering-values-outside-of-test-flow"},"Registering values outside of test flow"),(0,i.kt)("p",null,"It is possible to define singleton values outside of all test flow by using the ",(0,i.kt)("inlineCode",{parentName:"p"},"registerSingleton")," function from ",(0,i.kt)("inlineCode",{parentName:"p"},"@autometa/injection"),". This function\naccepts a token and a value, and will make that value available to all classes that depend on it."),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-ts"},"import { registerSingleton, Token } from '@autometa/injection';\nimport { Fixture } from '@autometa/runner';\n\nregisterSingleton(Token('myToken'), \"Hello World\");\n\n@Fixture\n@Constructor(\n  Token('myToken'),\n  MyClass\n)\nclass MyOtherClass {\n  constructor(myToken: string, myClass: MyClass) {\n    console.log(myToken); // \"Hello World\"\n  }\n}\n")),(0,i.kt)("h2",{id:"tokens"},"Tokens"),(0,i.kt)("p",null,"Under the hood, tokens are defined as ",(0,i.kt)("inlineCode",{parentName:"p"},"symbol")," types, however unlike calling ",(0,i.kt)("inlineCode",{parentName:"p"},"Symbol(key)")," directly, the ",(0,i.kt)("inlineCode",{parentName:"p"},"Token")," function\nwill always return the same symbol for the same key. This means that you can use the same token in different files and\nthey will be treated as the same token."),(0,i.kt)("p",null,"However it might still be desirable to cache tokens, for example on a InjectionToken object:"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-ts"},"import { Token } from '@autometa/injection';\n\nconst InjectionToken = {\n  myToken: Token('myToken');\n}\n")))}u.isMDXComponent=!0}}]);