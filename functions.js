global.waitTimeout = function(ms = 1000, fn, ...args) {
  if (typeof fn === "number" && typeof ms === "function") [ms, fn] = [fn, ms]
  return new Promise(resolve => {
    setTimeout(typeof fn === "function" ? () => resolve(fn(...args)) : resolve, ms, ...args)
  })
}

Object.defineProperty(Function.prototype, "header", {
  get: function() {
    const d = this.toString().split(/\s+/).join(" ").match(/^(async)? *(function)? *(\w+)? *\((.+?)\) *(?:=>|{)/)
    return `${d[1] ? `${d[1]} ` : ""}${d[2] ? `${d[2]} ` : ""}${d[3] || ""}(${d[4]?.trim() || ""})`
  },
  configurable: true
})

Object.defineProperty(Number.prototype, Symbol.iterator, {
  value: function* () {
    if (!isFinite(this) || isNaN(this)) throw new TypeError(`${this} is not iterable`)

    const f = i => this > 0 ? i < this : i > this
    for (let i = 0; f(i); this > 0 ? i++ : i--) yield i;
  },
  writable: true,
  configurable: true
})

Object.defineProperty(Date.prototype, "format", {
  value: function(options) {
    if (!options) options = {}
    let style = "ios", date, seconds, hour12 = false
    if (typeof options === "string") style = options
    else if (typeof options === "object") ({ style = "ios", date, seconds, hour12 = false } = options)
    
    const [weekday, month, day, hour, minute, second] = this.toLocaleString(undefined, {
      day: "numeric",
      weekday: "short",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12,
      timeZone: "Europe/London",
      month: "short",
    })
      .replace(/AM|PM/g, "")
      .split(/, |:| /)
    
    if (typeof style !== "string") style = "ios"
    if (!["ios", "normal", "clock"].includes(style.toLowerCase())) {
      return style
        .replace(/DD/g, day)
        .replace(/\/?MM\/?/g, m => m.includes("/") ? m.replace("MM", this.getMonth() + 1) : month)
        .replace(/YY/g, this.getFullYear())
        .replace(/WD/g, weekday)
        .replace(/HH/g, hour)
        .replace(/mm/g, minute)
        .replace(/SS/g, second)
    }
    
    if (style === "ios") return `${hour}:${minute}${seconds ? ":" + second : ""} ${weekday} ${day} ${month}`
    if (style === "normal") return `${date ? `${weekday}, ${month} ${day}, ` : ""}${hour}${minute}${seconds ? ":" + second : ""}`
    return (seconds ? [hour, minute, second] : [hour, minute]).join(":")
  },
  writable: true,
  configurable: true
})

Object.defineProperty(process.hrtime, "format", {
  value: function(hrtime) {
    if (!Array.isArray(hrtime)) return ""
    return `${hrtime[0] > 0 ? `${hrtime[0]}s ` : ""}${hrtime[1] / 1000000}ms`
  },
  writable: true,
  configurable: true
})

const { words } = require("lodash")
Object.defineProperties(String.prototype, {
  stripIndents: {
    value: function(tabSize) {
      if (!tabSize || typeof tabSize !== "number" || tabSize < 1) return this.trim().replace(/^[\t ]+/gm, "")
      return this.trim().replace(new RegExp(`^[\\t ]{0,${tabSize}}`, "gm"), "")
    },
    writable: true,
    configurable: true
  },
  toProperCase: {
    value: function(all = false) {
      return this.words().map((str, i) => i && all || !i ? str[0].toUpperCase() + str.slice(1).toLowerCase() : str.toLowerCase()).join(" ")
    },
    writable: true,
    configurable: true
  },
  words: {
    value: function(pattern) { return words(this, pattern) },
    writable: true,
    configurable: true
  },
  pad: {
    value: function(maxLength, fillString = " ") {
      let space = (maxLength - this.length) / 2
      if (space <= 0) return this.valueOf()
      space = Math.floor(space)
      return this.padStart(space + this.length, fillString).padEnd(maxLength, fillString)
    },
    writable: true,
    configurable: true
  }
})

Object.defineProperties(Promise.prototype, {
  default: {
    value: function(val) {
      return this.catch(() => val).then(v => v ?? val) // if a resolved promise returns undefined
    },
    writable: true,
    configurable: true
  },
  silence: {
    value: function(val) {
      // i actually shouldnt be disregarding all errors lol i should be trying to fix them
      return this.catch(err => console.error("Silenced Error:", err?.stack || err) || val)
    },
    writable: true,
    configurable: true
  },
  return: {
    value: function(val) {
      return this.then(() => val).catch(() => val)
    },
    writable: true,
    configurable: true
  },
  catchErrors: {
    value: function(filter, handler) {
      if (typeof handler !== "function") return this
      if (typeof filter !== "string" && !Array.isArray(filter) && !(filter instanceof RegExp))
        return this.catch(handler)
      return this.catch(e => {
        const m = Array.isArray(filter) || typeof filter === "string" ? "includes" : "test"
        if (filter[m](e) || filter[m](e?.message ?? e) || filter[m](e?.name ?? e)) return handler(e)
        throw e
      })
    },
    writable: true,
    configurable: true
  },
  silenceErrors: {
    value: function(filter, value) {
      return this.catchErrors(filter, () => value)
    },
    writable: true,
    configurable: true
  }
})

Object.defineProperties(Array.prototype, {
  first: {
    value: function(amount) {
      return !isNaN(amount) && amount > 0 ? this.slice(0, amount) : this[0]
    },
    writable: true,
    configurable: true
  },
  last: {
    value: function(amount) {
      return !isNaN(amount) && amount > 0 ? this.slice(this.length - amount) : this[this.length - 1]
    },
    writable: true,
    configurable: true
  },
  random: {
    value: function(times = 1) {
      if (!this.length) return times === 1 ? undefined : []
      if (times === 1) {
        return this[Math.floor(Math.random() * this.length)]
      } else {
        const returnArray = []
        if (isNaN(times)) return returnArray
        for (const i of +times) {
          returnArray.push(this[Math.floor(Math.random() * this.length)])
        }
        return returnArray
      }
    },
    writable: true,
    configurable: true
  },
  clone: {
    value: function() {
      return this.slice()
    },
    writable: true,
    configurable: true
  },
  trim: {
    value: function(...values) {
      if (values.length === 0) values.length = 1
      return this.filter(el => !values.includes(el))
    },
    writable: true,
    configurable: true
  },
  remove: {
    value: function(...values) {
      if (values.length > 1) {
        for (const val of values) this.remove(val)
        return this
      }
    
      const [val] = values
      if (this.includes(val)) {
        let i = this.length
        while (i--) if (Object.is(this[i], val)) this.splice(i, 1)
      }
      
      return this
    },
    writable: true,
    configurable: true
  },
  asyncMap: {
    value: function(func, thisArg) {
      return Promise.all(this.map(func, thisArg))
    },
    writable: true,
    configurable: true
  }
})

/**
 * Give a number significant digits.
 * @param {number} number The number to transform. e.g 3482
 * @param {number} digits The amount of significant digits the number should have. e.g 1
 * @returns {number} The number with digits amount of significant digits. e.g 3000
 */
Math.significant = (number, digits) => {
  if (isNaN(number)) throw new TypeError("No number was specified.")
  if (isNaN(digits)) throw new TypeError("Second parameter needs to be a number.")
  number = Number(number)
  digits = Number(digits)
  
  if (number.toString().includes(".") && number.toString().split(".")[1].length >= digits) return number.toFixed(digits)
  let times = number.toString().split(".")[0].length - digits
  return Math.round(number / (10 ** times)) * (10 ** times) || 0
}