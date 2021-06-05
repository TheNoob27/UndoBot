declare module "command-tags" {
  interface Options {
    string: string
    prefix: string
    numbersInStrings: boolean
    removeAllTags: boolean
    negativeNumbers: boolean
    numberDoubles: boolean
    lowercaseTags: boolean
    tagData: Record<string, NumberConstructor | StringConstructor | BooleanConstructor | ObjectConstructor>
  }
  interface Tag {
    tag: string
    value:
      | NumberConstructor
      | StringConstructor
      | BooleanConstructor
      | RegExpConstructor
      | ArrayConstructor
      | ObjectConstructor
      | JSON
      | string
    resolve: true
  }
  interface ParsedTags {
    string: string
    newString: string
    matches: string[]
    data: Record<string, string | number | *[]>
    tagData: Record<string, NumberConstructor | StringConstructor | BooleanConstructor | ObjectConstructor>
  }

  function Tagify(options: Options, tags: (Tag | string)[]): ParsedTags
  function Tagify(options: Options, ...tags: (Tag | string)[]): ParsedTags
  function Tagify(string: string, tags: (Tag | string)[]): ParsedTags
  function Tagify(string: string, ...tags: (Tag | string)[]): ParsedTags
  export default Tagify
  export const version: string
}