
const f = "YourClass"
const classes = {
    MyClass: class {
        foo = 1
    },
    [f]: class {
        bar = 2
    }
}
test('it', ()=>{
    const mc = new classes.MyClass()
    const fc = new classes[f]()
    console.log(classes.MyClass.name)
    console.log(mc.constructor.name)
    console.log(classes[f].name)
    console.log(fc.constructor.name)
})