import MockDate from 'mockdate'

import {
  toQueryString,
  parseResponseHeaders,
  lowerCaseObjectKeys,
  performanceNow,
  isPlainObject,
  btoa,
  nullSafeObject
} from 'src/utils'

describe('utils', () => {
  describe('#toQueryString', () => {
    describe('for non-object', () => {
      it('returns the original entry', () => {
        expect(toQueryString(1)).toEqual(1)
        expect(toQueryString(1.1)).toEqual(1.1)
        expect(toQueryString('value')).toEqual('value')
      })
    })

    describe('for objects', () => {
      it('ignores undefined or null values', () => {
        expect(toQueryString({ a: 1, b: undefined, c: null })).toEqual('a=1')
      })

      it('appends & for multiple values', () => {
        expect(toQueryString({ a: 1, b: 'val', c: true })).toEqual('a=1&b=val&c=true')
      })

      it('encodes "%20" to "+"', () => {
        const params = { a: 'some big string' }
        expect(toQueryString(params)).toEqual('a=some+big+string')
      })

      describe('in blank', () => {
        it('returns an empty string', () => {
          expect(toQueryString({})).toEqual('')
        })
      })

      describe('with object values', () => {
        it('converts the keys to "key[another-key]" pattern', () => {
          const params = decodeURIComponent(toQueryString({ a: { b: 1, c: 2 } }))
          expect(params).toEqual('a[b]=1&a[c]=2')
        })

        it('works with nested objects', () => {
          const params = decodeURIComponent(toQueryString({ a: { b: 1, c: { d: 2 } }, e: 3 }))
          expect(params).toEqual('a[b]=1&a[c][d]=2&e=3')
        })
      })

      describe('with array values', () => {
        it('converts the keys to "key[]" pattern', () => {
          const params = decodeURIComponent(toQueryString({ a: [1, 2, 3] }))
          expect(params).toEqual('a[]=1&a[]=2&a[]=3')
        })

        it('works with nested arrays', () => {
          const params = decodeURIComponent(toQueryString({ a: [1, [2, [3, 4]]] }))
          expect(params).toEqual('a[]=1&a[][]=2&a[][][]=3&a[][][]=4')
        })
      })
    })
  })

  describe('#parseResponseHeaders', () => {
    let responseHeaders

    beforeEach(() => {
      /* eslint-disable */
      responseHeaders = 'X-RateLimit-Remaining: 57\
  \r\nLast-Modified: Mon, 09 Nov 2015 19:06:15 GMT\
  \r\nETag: W/"679e71e24e6d901f5b36a55c5d80a32d"\
  \r\nContent-Type: application/json; charset=utf-8\
  \r\nCache-Control: public, max-age=60, s-maxage=60\
  \r\nX-RateLimit-Reset: 1447102379\
  \r\nX-RateLimit-Limit: 60\
  '
      /* eslint-enable */
    })

    it('returns an object with all headers with lowercase keys', () => {
      const headers = parseResponseHeaders(responseHeaders)
      expect(headers).toEqual(jasmine.objectContaining({ 'x-ratelimit-remaining': '57' }))
      expect(headers).toEqual(jasmine.objectContaining({ 'last-modified': 'Mon, 09 Nov 2015 19:06:15 GMT' }))
      expect(headers).toEqual(jasmine.objectContaining({ 'etag': 'W/"679e71e24e6d901f5b36a55c5d80a32d"' }))
      expect(headers).toEqual(jasmine.objectContaining({ 'content-type': 'application/json; charset=utf-8' }))
      expect(headers).toEqual(jasmine.objectContaining({ 'cache-control': 'public, max-age=60, s-maxage=60' }))
      expect(headers).toEqual(jasmine.objectContaining({ 'x-ratelimit-reset': '1447102379' }))
      expect(headers).toEqual(jasmine.objectContaining({ 'x-ratelimit-limit': '60' }))
    })
  })

  describe('#lowerCaseObjectKeys', () => {
    it('returns a new object with all keys in lowercase', () => {
      const obj = { ABC: 1, DeF: 2, ghI: 3 }
      expect(lowerCaseObjectKeys(obj)).toEqual({ abc: 1, def: 2, ghi: 3 })
      expect(obj.ABC).toEqual(1)
    })
  })

  describe('#performanceNow', () => {
    it('returns the same value as "new Date().getTime()"', () => {
      MockDate.set('2017-08-08T20:57:00Z')
      expect(performanceNow()).toEqual(Date.now())
    })
  })

  describe('#isPlainObject', () => {
    it('returns true for plain objects', () => {
      function Custom () {}
      expect(isPlainObject(new Custom())).toEqual(false)
      expect(isPlainObject({ plain: true })).toEqual(true)
    })
  })

  describe('#nullSafeObject', () => {
    it('returns an object with the same values if no key has a null or undefined value', () => {
      const obj = { ABC: 1, DeF: 2, ghI: 3 }
      expect(nullSafeObject(obj)).toEqual(obj)
    })

    it('returns an object without the keys with null values', () => {
      const obj = { ABC: 1, DeF: 2, ghI: null }
      const expectedObj = { ABC: 1, DeF: 2 }
      expect(nullSafeObject(obj)).toEqual(expectedObj)
    })

    it('returns an object without the keys with undefined values', () => {
      const obj = { ABC: 1, DeF: 2, ghI: undefined }
      const expectedObj = { ABC: 1, DeF: 2 }
      expect(nullSafeObject(obj)).toEqual(expectedObj)
    })

    it('returns an empty object if argument is null', () => {
      expect(nullSafeObject(null)).toEqual({})
    })

    it('returns an empty object if argument is undefined', () => {
      expect(nullSafeObject(undefined)).toEqual({})
    })
  })

  describe('#btoa', () => {
    it('can encode ASCII input', () => {
      expect(btoa('')).toEqual('')
      expect(btoa('f')).toEqual('Zg==')
      expect(btoa('fo')).toEqual('Zm8=')
      expect(btoa('foo')).toEqual('Zm9v')
      expect(btoa('quux')).toEqual('cXV1eA==')
      expect(btoa('!"#$%')).toEqual('ISIjJCU=')
      expect(btoa("&'()*+")).toEqual('JicoKSor')
      expect(btoa(',-./012')).toEqual('LC0uLzAxMg==')
      expect(btoa('3456789:')).toEqual('MzQ1Njc4OTo=')
      expect(btoa(';<=>?@ABC')).toEqual('Ozw9Pj9AQUJD')
      expect(btoa('DEFGHIJKLM')).toEqual('REVGR0hJSktMTQ==')
      expect(btoa('NOPQRSTUVWX')).toEqual('Tk9QUVJTVFVWV1g=')
      expect(btoa('YZ[\\]^_`abc')).toEqual('WVpbXF1eX2BhYmM=')
      expect(btoa('defghijklmnop')).toEqual('ZGVmZ2hpamtsbW5vcA==')
      expect(btoa('qrstuvwxyz{|}~')).toEqual('cXJzdHV2d3h5ent8fX4=')
    })

    it('cannot encode non-ASCII input', () => {
      expect(() => btoa('✈'))
        .toThrowError("[Mappersmith] 'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.")
    })

    it('coerces input', () => {
      expect(btoa(42)).toEqual(btoa('42'))
      expect(btoa(null)).toEqual(btoa('null'))
      expect(btoa({ x: 1 })).toEqual(btoa('[object Object]'))
    })
  })
})
