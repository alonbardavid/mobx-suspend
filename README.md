# mobx-suspend

[![npm version][npmv-image]][npmv-url]
[![build status][travis-image]][travis-url]
[![npm downloads][npmd-image]][npmd-url]

> mobx utilities to suspend/unsuspend reactions

`mobx-suspend` contains functions you can use instead of the standard mobx _reaction_ and _computed_ features that 
allows them to be suspended dynamically.
## Installation

```
$ npm install mobx-suspend --save
```
or if using yarn
```
$ yarn add mobx-suspend
```

## Basic Usage

### Suspendable computed
```js
    import {observable,autorun,computed} from 'mobx';
    import {suspendableComputed} from "mobx-suspend";
    
    const myComputed = suspendableComputed();
    
    class MyClass {
        @observable
        value = "initial";
        @myComputed
        get actual(){
         return `${this.value}-with-addition`
        }
    }
    const instance = new MyClass();
    autorun(()=>console.log(instance.value))
    myComputed.suspend();
    instance.value = "first change";
    // console.log is not called
    instance.value = "second change";
    //console.log is not called
    myComputed.unsuspend();
```

### Suspendable reaction
```js
    import {suspendableReaction} from "mobx-suspend";
    import {observable} from "mobx";
    
    const value = observable.box("initial");
    const reaction = suspendableReaction(()=>value.get(),v=>console.log(v))
    reaction.suspend();
    value.set("new value");
    //the console.log action is not called
    reaction.unsuspend()
    //the console.log action is called with "new value"
```

## License

MIT

[travis-image]: https://img.shields.io/travis/alonbardavid/mobx-suspend/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/alonbardavid/mobx-suspend
[codecov-image]: https://img.shields.io/codecov/c/github/alonbardavid/mobx-suspend.svg?style=flat-square
[codecov-url]: https://codecov.io/gh/alonbardavid/mobx-suspend
[npmv-image]: https://img.shields.io/npm/v/mobx-suspend.svg?style=flat-square
[npmv-url]: https://www.npmjs.com/package/mobx-suspend
[npmd-image]: https://img.shields.io/npm/dm/mobx-suspend.svg?style=flat-square
[npmd-url]: https://www.npmjs.com/package/mobx-suspend
