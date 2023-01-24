"use strict";(self.webpackChunkautometa=self.webpackChunkautometa||[]).push([[22],{9613:(e,t,n)=>{n.d(t,{Zo:()=>u,kt:()=>m});var a=n(9496);function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function o(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function s(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?o(Object(n),!0).forEach((function(t){r(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function i(e,t){if(null==e)return{};var n,a,r=function(e,t){if(null==e)return{};var n,a,r={},o=Object.keys(e);for(a=0;a<o.length;a++)n=o[a],t.indexOf(n)>=0||(r[n]=e[n]);return r}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(a=0;a<o.length;a++)n=o[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(r[n]=e[n])}return r}var l=a.createContext({}),c=function(e){var t=a.useContext(l),n=t;return e&&(n="function"==typeof e?e(t):s(s({},t),e)),n},u=function(e){var t=c(e.components);return a.createElement(l.Provider,{value:t},e.children)},d="mdxType",p={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},h=a.forwardRef((function(e,t){var n=e.components,r=e.mdxType,o=e.originalType,l=e.parentName,u=i(e,["components","mdxType","originalType","parentName"]),d=c(n),h=r,m=d["".concat(l,".").concat(h)]||d[h]||p[h]||o;return n?a.createElement(m,s(s({ref:t},u),{},{components:n})):a.createElement(m,s({ref:t},u))}));function m(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var o=n.length,s=new Array(o);s[0]=h;var i={};for(var l in t)hasOwnProperty.call(t,l)&&(i[l]=t[l]);i.originalType=e,i[d]="string"==typeof e?e:r,s[1]=i;for(var c=2;c<o;c++)s[c]=n[c];return a.createElement.apply(null,s)}return a.createElement.apply(null,n)}h.displayName="MDXCreateElement"},595:(e,t,n)=>{n.r(t),n.d(t,{contentTitle:()=>l,default:()=>p,frontMatter:()=>i,metadata:()=>c,toc:()=>u});var a=n(5882),r=n(950),o=(n(9496),n(9613)),s=["components"],i={},l="Storing Data Between Tests",c={unversionedId:"bdd/cucumber/data",id:"bdd/cucumber/data",title:"Storing Data Between Tests",description:"An issue arises with steps when data must be passed between them. In vanilla Cucumber, that is achieved with the World object.",source:"@site/docs/1_bdd/cucumber/7_data.md",sourceDirName:"1_bdd/cucumber",slug:"/bdd/cucumber/data",permalink:"/autometa/docs/bdd/cucumber/data",editUrl:"https://github.com/Bendat/autometa/docs/1_bdd/cucumber/7_data.md",tags:[],version:"current",sidebarPosition:7,frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"Tags & Filtering Tests",permalink:"/autometa/docs/bdd/cucumber/filtering"},next:{title:"Setup & Configuration",permalink:"/autometa/docs/bdd/cucumber/Configuration/setup"}},u=[{value:"The World Object",id:"the-world-object",children:[],level:2},{value:"Store",id:"store",children:[],level:2}],d={toc:u};function p(e){var t=e.components,n=(0,r.Z)(e,s);return(0,o.kt)("wrapper",(0,a.Z)({},d,n,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("h1",{id:"storing-data-between-tests"},"Storing Data Between Tests"),(0,o.kt)("p",null,"An issue arises with steps when data must be passed between them. In vanilla Cucumber, that is achieved with the ",(0,o.kt)("a",{parentName:"p",href:"https://github.com/cucumber/cucumber-js/blob/main/docs/support_files/world.md"},"World")," object."),(0,o.kt)("p",null,"As autometa is a structured test runner, it is possible to create objects inside the test ",(0,o.kt)("inlineCode",{parentName:"p"},"Scenario"),"s themselves."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts",metastring:"title='Using a plain object'",title:"'Using",a:!0,plain:!0,"object'":!0},"Feature(({ Scenario }) => {\n  Scenario('Search Google', ({ Given, When, Then }) => {\n    const data: any = {};\n    Given('a user on the google homepage', () => {\n      data.user = new User();\n    });\n\n    When('they search for {string} on google', async (searchTerm) => {\n      data.result = await data.user.SearchGoogle(searchTerm);\n    });\n\n    Then('they see a result for {string}', (website) => {\n      const desiredWebsite = getWebsite(website, data.result);\n      expect(desireWebsite).toBeDefined();\n      // other validations\n    });\n  });\n}, './sample.feature');\n")),(0,o.kt)("p",null,"This works, but there is no type safety and no way to communicate this object with shared steps."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts",metastring:"title='share-steps.ts'",title:"'share-steps.ts'"},"const setupUser: Steps = ({ Given }) => {\n    Given('a user on the google homepage', ()=>{\n        data.user = new User() // uh-oh\n    })\n});\n")),(0,o.kt)("p",null,"To work around it, shared steps can be wrapped\nin a function which accepts the data object."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts",metastring:"title='share-steps.ts'",title:"'share-steps.ts'"},"const setupUser: Steps = (data: any) => {\n  return ({ Given }) => {\n    Given('a user on the google homepage', () => {\n      data.user = new User(); // ok\n    });\n  };\n};\n")),(0,o.kt)("p",null,"To reduce on boiler plate, you have access to..."),(0,o.kt)("h2",{id:"the-world-object"},"The World Object"),(0,o.kt)("p",null,"The World object behaves similarly to vanilla cucumber. It is an empty object which accepts ",(0,o.kt)("inlineCode",{parentName:"p"},"any")," value and returns ",(0,o.kt)("inlineCode",{parentName:"p"},"unknown")," when accessed."),(0,o.kt)("p",null,"The World object is available in the second argument of the scenario\ncall back and can be destructured with the name ",(0,o.kt)("inlineCode",{parentName:"p"},"World")),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts",metastring:'title="World Object',title:'"World',Object:!0},"Feature(({ Scenario }) => {\n  Scenario('Search Google', ({ Given, When, Then }, { World }) => {\n    Given('a user on the google homepage', () => {\n      World.user = new User();\n    });\n\n    When('they search for {string} on google', async (searchTerm) => {\n      World.result = await data.user.SearchGoogle(searchTerm);\n    });\n\n    Then('they see a result for {string}', (website) => {\n      const desiredWebsite = getWebsite(website, World.result);\n      expect(desireWebsite).toBeDefined();\n      // other validations\n    });\n  });\n}, './sample.feature');\n")),(0,o.kt)("p",null,(0,o.kt)("inlineCode",{parentName:"p"},"World")," is unique to each ",(0,o.kt)("inlineCode",{parentName:"p"},"Scenario")," (including the scenarios of a ",(0,o.kt)("inlineCode",{parentName:"p"},"Scenario Outline"),", and scenarios automatically constructed by ",(0,o.kt)("a",{parentName:"p",href:"/autometa/docs/bdd/cucumber/all-steps"},"Automatic Scenarios"),")."),(0,o.kt)("p",null,(0,o.kt)("inlineCode",{parentName:"p"},"World")," is automatically injected into all Shared Steps."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts",metastring:"title='share-steps.ts'",title:"'share-steps.ts'"},"const setupUser: Steps = ({ Given }, { World }) => {\n    Given('a user on the google homepage', ()=>{\n        World.user = new User();\n    })\n});\n")),(0,o.kt)("h2",{id:"store"},"Store"),(0,o.kt)("p",null,"Alternatively, like ",(0,o.kt)("inlineCode",{parentName:"p"},"World"),", the second argument contains a unique ",(0,o.kt)("inlineCode",{parentName:"p"},"Store")," object, which is also injected into Shared Steps."),(0,o.kt)("p",null,"Store caches values with its ",(0,o.kt)("inlineCode",{parentName:"p"},"put")," method and they can be retrieved with ",(0,o.kt)("inlineCode",{parentName:"p"},"read"),"."),(0,o.kt)("p",null,(0,o.kt)("inlineCode",{parentName:"p"},"put")," takes a key, which is a string, and a value to store."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts",metastring:"title='put'",title:"'put'"},"Scenario('a scenario', ({ When }, { Store }) => {\n  // ... given code\n\n  When('the the user POSTs their details', async () => {\n    const response = await ServiceClient.post({ username: 'freddy' });\n    Store.put('returnedResponse', response);\n  });\n});\n")),(0,o.kt)("p",null,(0,o.kt)("inlineCode",{parentName:"p"},"read")," also takes a key and returns the value associated with it, if any, which can be cast to a type argument."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts",metastring:"title'read'","title'read'":!0},"Scenario('a scenario', ({ Given }, { Store }) => {\n  // ... given, when code\n\n  Then('the user object is returned', () => {\n    const expected = { username: 'freddy' };\n    const response = Store.read<UserResponse>('providedNumber', numVal);\n    expect(response).toBe(expected);\n  });\n});\n")),(0,o.kt)("p",null,"Optionally, both methods accept validation options which if configured\nwill cause the ",(0,o.kt)("inlineCode",{parentName:"p"},"Store")," instance to log a warning and/or throw an error\nwhen a null or undefined value is passed to the store."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"interface ValidationOptions {\n  warn?: boolean;\n  throws?: boolean;\n}\n")),(0,o.kt)("p",null,"When ",(0,o.kt)("inlineCode",{parentName:"p"},"warn")," is set to true, and a value of null or undefined is added or accessed, it will cause a ",(0,o.kt)("inlineCode",{parentName:"p"},"console.warn")," to be issued. If a read fails and ",(0,o.kt)("inlineCode",{parentName:"p"},"warn")," is enabled, a report will be printing indicating if a value has ever been added for that key, or it was never ",(0,o.kt)("inlineCode",{parentName:"p"},"put"),"ted at all."),(0,o.kt)("p",null,(0,o.kt)("inlineCode",{parentName:"p"},"throws")," throws an error when a null or undefined value is found."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"Store.put('returnedResponse', response, { warn: true });\n....\n\nconst storedResponse = Store.read<UserObject>('returnedResponse', {\n  throws: true,\n});\n")))}p.isMDXComponent=!0}}]);