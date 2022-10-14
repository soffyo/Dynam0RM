# TODO List
## Code
* ~~Fix **Save** command when only partition key and sort key are present~~
* Add *ScanIndexForward* parameter to `query` method
* ~~Add *provisionedThroughput* to `init` method~~
* ~~Add *infrequent* parameter to `init` method~~
* Make *updateTable* static method for updating the table
* Investigate for a `@Stream` decorator or add *stream* parameter to `init` method
* Secondary Indexes decorators
  * ~~Make Local Secondary Index~~
  * ~~Make Global Secondary Index~~
  * ~~Update query method for global indexes~~
  * ~~Implement unique name generation if name is not provided for an index~~
  * Make query method on index **??**
* Make *size* operator logic in ./generators/conditions.ts
* Make ScanIndex method **??**
* Implement **Transactions**
* Check if paginator is really needed **??**
* Implement TimeToLive
* Implement **OR** operator
* Add operators handling to update statements
## README
* Rewrite including new features