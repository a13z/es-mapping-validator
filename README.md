es-mapping-validator
====================

Validate Elastic Search document with its mapping.

If you get error like this
```
{
   "error": "RemoteTransportException[[BlaBla-Bla][inet[/10.74.184.8:2121]][update]]; nested: MapperParsingException[object mapping for [profile] tried to parse as object, but got EOF, has a concrete value been provided to it?]; ",
   "status": 400
}
```
you need to find the document property wich mismatch its mapping. Of course it will not be property `profile` that you can see in the error :). This tool will hellp you to find mismatching fields.
