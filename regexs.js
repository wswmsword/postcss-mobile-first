module.exports = {
  /** 用于验证字符串是否为“数字px”的形式 */
  pxTestReg: /(?<=\d)px/,
  /** 用于匹配字符串形如“数字px”的字符串，不可以在 url() 中
   *
   * (\d+\.\d+|\d+|\.\d+) // 数字
   *
   * url\((\\\(|\\\)|[^\(\)])*\) // url(...)
   *
   * (?<=(url\((\\\(|\\\)|[^\(\)])*\)).*?)(?:\d+\.\d+|\d+|\.\d+)px // 前面必须有 url()，后面必须跟 px
   *
   * (?:\d+\.\d+|\d+|\.\d+)px(?=(.*?url\((\\\(|\\\)|[^\(\)])*\))) // 后面必选有 px 和 url()
   *
   * (?<!url.*?)(?:\d+\.\d+|\d+|\.\d+)px(?!.*?url) // 前面和后面都没有 url，必须跟 px
   */
  pxMatchReg: /(?:(?<=(url\((\\\(|\\\)|[^\(\)])*\)).*?)(?:\d+\.\d+|\d+|\.\d+)px)|(?:(?:\d+\.\d+|\d+|\.\d+)px(?=(.*?url\((\\\(|\\\)|[^\(\)])*\))))|(?:(?<!url.*?)(?:\d+\.\d+|\d+|\.\d+)px(?!.*?url))/g,

}