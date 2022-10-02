# TODO List
## Code
* Add *ScanIndexForward* parameter to `query` method
* ~~Add *provisionedThroughput* to `init` method~~
* ~~Add *infrequent* parameter to `init` method~~
* Make *update* static method for updating the table
* Investigate for a `@Stream` decorator or add *stream* parameter to `init` method
* Secondary Indexes decorators
  * ~~Make Local Secondary Index~~
  * ~~Make Global Secondary Index~~
  * ~~Update query method for global indexes~~
  * Implement unique name generation if name is not provided for an index
* Make *size* operator logic in ./generators/conditions.ts
* Make ScanIndex method
* Make Transaction methods
* Check Paginator ?
* Implement TimeToLive
## README
* Rewrite including new features