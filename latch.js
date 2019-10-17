(function (name, global, library) {
    if (window !== global) {
        throw new Error(`The ${name} library can only be used in the browser!`)
    }

    global[name] = library()
})("latch", this, function () {
    const INPUT_TAG = "INPUT"
    const TEXTAREA_TAG = "TEXTAREA"
    
    const PLAIN_LATCH_TYPE = "plain"
    const LOOP_LATCH_TYPE = "loop"
    const FORM_LATCH_TYPE = "form"
    
    const BIT_CLASS = "bit"
    
    /** DEFINITIONS */
    
    /**
     * A basic unit of a Latch UI.
     * 
     * @typedef Bit
     * @property {HTMLElement} element - HTML element targeted by this Bit.
     * @property {string} currentValue - current value of the Bit, in string.
     * @property {string} [key] - identifier of this Bit.
     * @property {BitRenderer} render - render function of this Bit.
     */
    
    /**
     * A type of Latch used to render a single record/map of data.
     * 
     * @typedef PlainLatch
     * @property {HTMLElement} element - HTML element targeted by this Latch.
     * @property {string} type - string that holds the type of this Latch.
     * @property {Bit[]} bits - children of this Plain Latch.
     * @property {PlainLatchRenderer} render - render function of this Plain Latch.
     * @property {PlainLatchCloner} clone - clone function of this Plain Latch.
     */
    
    /**
     * A type of Latch used to render lists of data.
     * 
     * @typedef LoopLatch
     * @property {HTMLElement} element - HTML element targeted by this Latch.
     * @property {string} type - string that holds the type of this Latch.
     * @property {PlainLatch} template - template used to create children of this Latch.
     * @property {LoopLatchRenderer} render - render function of this Latch.
     */
    
    /**
     * A type of Latch used to control forms.
     * 
     * @typedef FormLatch
     * @property {HTMLElement} element - HTML element targeted by this Latch.
     * @property {string} type - string that holds the type of this Latch.
     * @property {Object.<string, HTMLElement>} actions - map of actionable HTML elements.
     * @property {Object.<string, HTMLElement>} inputs - map of HTML elements that hold the values of this Latch.
     * @property {FormLatchDataFetcher} data - data fetcher function of this Latch.
     */
    
    /**
     * An object containing details of a Form Latch hook - a mechanism that allows outside
     * processes to do things on action events of the Form Latch.
     * 
     * @typedef FormLatchHook
     * @property {string} action - key of the action reference of this Hook.
     * @property {string} event - name of the event handler of this Hook, ex: 'onclick'.
     * @property {FormLatchHookCallback} callback - function to be called when the Hook's event is triggered.
     */
    
    /**
     * Renders a given value to a Bit's element, with memoization.
     * 
     * @callback BitRenderer
     * @param {string} value - value to be rendered by the Bit. 
     * @returns {void}
     */
    
    /**
     * Renders a given prop map to a Plain Latch's list of bits, with memoization.
     * 
     * @callback PlainLatchRenderer
     * @param {Object.<string, string>} props - map of props to be rendered by the Latch. 
     * @returns {void}
     */
    
    /**
     * Deep clones a Plain Latch and returns the resultant clone.
     * 
     * @callback PlainLatchCloner
     * @param {Object.<string, string>} props - map of props to initialize the clone. 
     * @returns {PlainLatch}
     */
    
    /**
     * Renders a given list to a Loop Latch, with memoization.
     * 
     * @callback LoopLatchRenderer
     * @param {Object.<string, string>[]} list - list of propmaps to be rendered by the Latch. 
     * @returns {void}
     */
    
    /**
     * Fetches the current values of the Form Latch.
     * 
     * @callback FormLatchDataFetcher
     * @returns {Object.<string, string>}
     */
    
    /**
     * Callback function of a Form Latch Hook.
     * 
     * @callback FormLatchHookCallback
     * @param {Object.<string, HTMLElement>} inputs - map of input references.
     * @param {Event} - event object passed by the event listener.
     */
    
    /** END DEFINITIONS */
    
    /**
     * Creates a new Bit.
     * 
     * @param {HTMLElement} element - element to be targeted by the new Bit.
     * @param {string} [key] - identifier of the new Bit.
     * @returns {Bit}
     */
    function Bit (element, key) {
        if (!key) {
            key = element.getAttribute("data-key")
        }
    
        /** @type {BitRenderer} */
        var render = function (value) {
            if (typeof value !== "string") {
                throw new Error("A Bit Render only accepts a string argument!")
            }
    
            if (this.currentValue !== value) {
                if (this.element.tagName === INPUT_TAG || this.element.tagName === TEXTAREA_TAG) {
                    this.element.value = value
                } else {
                    this.element.textContent = value
                }
    
                this.currValue = value
            }
        }
    
        var output = {
            element: element,
            currentValue: null
        }
    
        output.render = render.bind(output)
    
        if (key) {
            output.key = key
        }
    
        return output
    }
    
    /**
     * Creates a Plain Latch.
     * 
     * @param {HTMLElement} element - HTML element to be targeted by the new Latch.
     * @param {Object.<string, string>} initialProps - map of values to initialize the bits of the new Latch.
     * @returns {PlainLatch}
     */
    function PlainLatch(element, initialProps = {}) {
        // validate parameters
        var elementIsInvalid = !element || (element && !(element instanceof HTMLElement))
        if (elementIsInvalid) {
            throw new Error("A Loop Latch requires the element parameter to be an HTML element.")
        }
    
        var initialPropsIsInvalid = initialProps && typeof initialProps !== "object"
        if (initialPropsIsInvalid) {
            throw new Error("A Plain Latch requires initialProps to be an object.")
        }
    
        /** @type {PlainLatchRenderer} */
        var render = function (props) {
            var propsIsInvalid = !props || props && typeof props !== "object"
            if (propsIsInvalid) {
                throw new Error("A Plain Latch render function requires an object!")
            }
    
            for (var x = 0; x < this.bits.length; x++) {
                var bit = this.bits[x]
    
                if (props[bit.key]) {
                    bit.render(props[bit.key])
                }
            }
        }
    
        var loadBits = function (element, props = {}) {
            /** @type {Bit[]} */
            var newBits = []
    
            /** @type {HTMLElement[]} */
            var bitElements = element.getElementsByClassName(BIT_CLASS)
    
            for (var x = 0; x < bitElements.length; x++) {
                var newBit = new Bit(bitElements[x])
    
                if (props[newBit.key]) {
                    newBit.render(props[newBit.key])
                }
    
                newBits.push(newBit)
            }
    
            return newBits
        }
    
        /** @type {PlainLatchCloner} */
        var clone = function (props = {}) {
            var propsIsInvalid = props && typeof props !== "object"
            if (propsIsInvalid) {
                throw new Error("A Plain Latch clone function requires an object!")
            }
    
            var elementClone = this.element.cloneNode(true)
            var cloneBits = loadBits(elementClone, props)
    
            var latchClone = {
                type: PLAIN_LATCH_TYPE,
                element: elementClone,
                bits: cloneBits
            }
    
            latchClone.render = render.bind(latchClone)
            latchClone.clone = clone.bind(latchClone)
    
            return latchClone
        }
    
        var output = {
            type: PLAIN_LATCH_TYPE,
            element: element,
            bits: loadBits(element, initialProps)
        }
        
        output.render = render.bind(output)
        output.clone = clone.bind(output)
    
        return output
    }
    
    /**
     * Creates a Loop Latch.
     * 
     * @param {HTMLElement} element - element targeted by this 
     * @param {HTMLElement | PlainLatch} template - template used to create a child of this Loop.
     * @param {Object.<string, string>[]} initialList - list of value maps to initialize this Latch.
     * @returns {LoopLatch}
     */
    function LoopLatch(element, template, initialList = []) {
        // validate parameters
        var elementIsInvalid = !element || (element && !(element instanceof HTMLElement))
        if (elementIsInvalid) {
            throw new Error("A Loop Latch requires the element parameter to be an HTML element.")
        }
    
        var templateIsInvalid = !template || (template && !(template instanceof HTMLElement || template instanceof PlainLatch))
        if (templateIsInvalid) {
            throw new Error("A Loop Latch requires the template parameter to be either an HTML element or a Plain Latch.")
        }
    
        var initialListIsInvalid = initialList && !Array.isArray(initialList)
        if (initialListIsInvalid) {
            throw new Error("A Loop Latch requires the initialList parameter to be an array.")
        }
    
        // convert template to Plain Latch
        if (template instanceof HTMLElement) {
            template = new PlainLatch(template)
        }
    
        // TODO: implement list memoization
        var render = function (list) {
            if (!Array.isArray(list)) {
                throw new Error("A Loop Latch render function requires an array!")
            }
    
            // clear element contents
            this.element.innerHTML = ""
    
            /** @type {PlainLatch[]} new element contents */
            var contents = []
    
            // iterate the list, create a Plain Latch for each item and render the item values
            for (var x = 0; x < list.length; x++) {
                var props = list[x]
                var content = this.template.clone(props)
                contents.push(content)            
            }
    
            // map to HTMLElements
            contents = contents.map(function (value) { return value.element })
    
            this.element.append(...contents)
        }
    
        var output = {
            type: LOOP_LATCH_TYPE,
            element: element,
            template: template
        }
    
        output.render = render.bind(output)
    
        return output
    }
    
    /**
     * Creates a Form Latch.
     * 
     * @param {HTMLElement} element - element to be targeted by this Latch.
     * @param {FormLatchHook[]} hooks - list of hooks to be used by this Latch.
     * @returns {FormLatch}
     */
    function FormLatch(element, hooks) {
        var inputRefs = Object.create(null)
        var actionRefs = Object.create(null)
    
        var bits = element.getElementsByClassName(BIT_CLASS)
        for (var x = 0; x < bits.length; x++) {
            var field = bits[x].getAttribute("data-field")
            var action = bits[x].getAttribute("data-action")
    
            if (field) {
                inputRefs[field] = bits[x]
            } else if (action) {
                actionRefs[action] = bits[x]
            }
        }
    
        for (var x = 0; x < hooks.length; x++) {
            let hook = hooks[x]
            actionRefs[hook.action][hook.event] = function (ev) {
                hook.callback(inputRefs, ev)
            }
        }
    
        var data = function () {
            var output = Object.create(null)
    
            var keys = Object.keys(this.inputs)
            for (var x = 0; x < keys.length; x++) {
                var key = keys[x]
    
                output[key] = this.inputs[key].value
            }
    
            return output
        }
    
        var output = {
            type: FORM_LATCH_TYPE,
            element: element,
            actions: actionRefs,
            inputs: inputRefs
        }
    
        output.data = data.bind(output)
    
        return output
    }

    return {
        Bit,
        PlainLatch,
        LoopLatch,
        FormLatch
    }
})