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


## Installation ##

```
npm install es-mapping-validator
```

## Usage ##

Run shell command `es-mapping-validator <args>`

* `-h`, `--host`: ElasticSearch host, for example `localhost:9200`
* `-i`, `--index`: Index name, for example `tweets`
* `-t`, `--type`: Document type, for example `tweet`
* `-d`, `--id`: Document id, for example `1`
* `-a`, `--auth` Http basic authentification (if need), for example 'username:password'
* `-m`, `--mismatches` **Flag** Print only type mismatches.
* `-f`, `--fullpath` **Flag** Print full field's names.
* `-r`, `--tree` **Flag** Print results as a tree.

Example

```
es-mapping-validator -h localhost:9200 -a user:password -i tweets -t tweet -d 1 -m
```
