'use strict'

const fp = require('fastify-plugin')
const reusify = require('reusify')

function checkAuth (fastify, opts, next) {
  fastify.decorate('auth', auth)
  next()
}

function auth (functions, opts) {
  if (!Array.isArray(functions)) {
    throw new Error('You must give an array of functions to the auth function')
  }
  if (!functions.length) {
    throw new Error('Missing auth functions')
  }

  const options = Object.assign({
    relation: 'or',
    run: null
  }, opts)

  if (options.relation !== 'or' && options.relation !== 'and') {
    throw new Error('The value of options.relation should be one of [\'or\', \'and\']')
  }
  if (options.run && options.run !== 'all') {
    throw new Error('The value of options.run must be \'all\'')
  }

  /* eslint-disable-next-line no-var */
  for (var i = 0; i < functions.length; i++) {
    functions[i] = functions[i].bind(this)
  }

  const instance = reusify(Auth)

  function _auth (request, reply, done) {
    const obj = instance.get()

    obj.request = request
    obj.reply = reply
    obj.done = done
    obj.functions = this.functions
    obj.options = this.options
    obj.i = 0
    obj.start = true
    obj.firstResult = null

    obj.nextAuth()
  }

  return _auth.bind({ functions, options })

  function Auth () {
    this.next = null
    this.i = 0
    this.start = true
    this.functions = []
    this.options = {}
    this.request = null
    this.reply = null
    this.done = null
    this.firstResult = null

    const that = this

    this.nextAuth = function nextAuth (err) {
that.request.log.info('1 ' + ', i: ' + that.i + ', start: ' + that.start + ', firstResult: ' + that.firstResult);
      // const func = that.functions[that.i++]
      const func = that.i < that.functions.length ? that.functions[that.i] : undefined
      that.i = that.i + 1

      if (!func) {
that.request.log.info('2 ' + ', i: ' + that.i + ', start: ' + that.start + ', firstResult: ' + that.firstResult);
        that.completeAuth(err)
        return
      }
that.request.log.info('2.1 ' + ', func: ' + func.name);
      const maybePromise = func(that.request, that.reply, that.onAuth)

      if (maybePromise && typeof maybePromise.then === 'function') {
that.request.log.info('3 ' + ', i: ' + that.i + ', start: ' + that.start + ', firstResult: ' + that.firstResult);
        maybePromise.then(results => that.onAuth(null, results), that.onAuth)
      }
    }

    this.onAuth = function onAuth (err, results) {
that.request.log.info('4 ' + ', i: ' + that.i + ', start: ' + that.start + ', firstResult: ' + that.firstResult);
      if (that.options.relation === 'or') {
that.request.log.info('5 ' + ', i: ' + that.i + ', start: ' + that.start + ', firstResult: ' + that.firstResult);
        if (err) {
that.request.log.info('6 ' + ', i: ' + that.i + ', start: ' + that.start + ', firstResult: ' + that.firstResult);
          return that.nextAuth(err)
        }

        return that.completeAuth()
      } else {
that.request.log.info('7 ' + ', i: ' + that.i + ', start: ' + that.start + ', firstResult: ' + that.firstResult);
        if (err) {
that.request.log.info('8 ' + ', i: ' + that.i + ', start: ' + that.start + ', firstResult: ' + that.firstResult);
          return that.completeAuth(err)
        }

        return that.nextAuth(err)
      }
    }

    this.completeAuth = function (err) {
that.request.log.info('9 ' + ', i: ' + that.i + ', start: ' + that.start + ', firstResult: ' + that.firstResult);
      if (that.start) {
that.request.log.info('10 ' + ', i: ' + that.i + ', start: ' + that.start + ', firstResult: ' + that.firstResult);
        that.start = false
        that.firstResult = err
      }

      if (that.options.run === 'all' && that.i < that.functions.length) {
that.request.log.info('11 ' + ', i: ' + that.i + ', start: ' + that.start + ', firstResult: ' + that.firstResult);
        return that.nextAuth(err)
      }

      if (that.firstResult && (!that.reply.raw.statusCode || that.reply.raw.statusCode < 400)) {
that.request.log.info('12 ' + ', i: ' + that.i + ', start: ' + that.start + ', firstResult: ' + that.firstResult);
        that.reply.code(401)
      } else if (!that.firstResult && that.reply.raw.statusCode && that.reply.raw.statusCode >= 400) {
that.request.log.info('13 ' + ', i: ' + that.i + ', start: ' + that.start + ', firstResult: ' + that.firstResult);
        that.reply.code(200)
      }

      that.done(that.firstResult)
      instance.release(that)
    }
  }
}

module.exports = fp(checkAuth, '3.x')
