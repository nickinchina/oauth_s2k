var config = {
    user: 'sa',
    password: '2447532',
    server:  process.env.DB_SERVER||'10.0.0.99',
    port: process.env.DB_PORT||31433,
    database:process.env.DB_NAME||'s2k',
    connectionTimeout: 30000,
    requestTimeout: 120000,
    pool: {
        max: process.env.DB_POOL_MAX || 10,
        min: process.env.DB_POOL_MIN || 0,
        idleTimeoutMillis: process.env.DB_POOL_IDLE || 30000
    },
    options: {
        appName: 's2k.js'
    }
};
var mssql = require('mssql');
var q = require('q');

module.exports = {
    query_simple: function(statement){
        var deferred = q.defer();
        var conn = new mssql.Connection(config);
        conn.connect(function __QUERY__(err) {
            if (err) return deferred.reject(err);
            var request = new mssql.Request(conn);
            request.query(statement, function(err, recordset) {
                if (err) return deferred.reject(err);
                deferred.resolve(recordset);
            });
        });
        return deferred.promise;
    },
    // var setParams = function(request, mssql) {
    //     params.forEach(function(i){
    //         if (i.length)
    //             request.input(i.name, mssql['NVarChar'](4001), i.value);
    //         else
    //             request.input(i.name, mssql[i.type], i.value);
    //     })
    // };
    query: function(statement, params) {
        var deferred = q.defer();
        var connection = new mssql.Connection(config, function(err) {
            if (err) return deferred.reject(err);
            var request = new mssql.Request(connection);
            
            params = params||[];
            params.forEach(params, function(i){
                if (i.length)
                    request.input(i.name, mssql[i.type](i.length), i.value);
                else
                    request.input(i.name, mssql[i.type], i.value);
            })
            request.execute(statement, function(err, recordset) {
                if (err) return deferred.reject(err);
                deferred.resolve(recordset);
            });
        });
        return deferred.promise;
    },
}