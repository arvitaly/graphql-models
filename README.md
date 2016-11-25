# graphql-models
Util for generate GraphQL-types from abstract models.

[![Build Status](https://travis-ci.org/arvitaly/graphql-models.svg?branch=master)](https://travis-ci.org/arvitaly/graphql-models)
[![npm version](https://badge.fury.io/js/graphql-models.svg)](https://badge.fury.io/js/graphql-models)
[![Coverage Status](https://coveralls.io/repos/github/arvitaly/graphql-models/badge.svg?branch=master)](https://coveralls.io/github/arvitaly/graphql-models?branch=master)
[![experimental](http://badges.github.io/stability-badges/dist/experimental.svg)](http://github.com/badges/stability-badges)

# Install

    npm install graphql-models --save

# Example

    import {graphql} from "graphql";
    import {AttributeTypes, Collection, ResolveTypes, Schema} from "graphql-models";
    
    const animalModel = {
        id: "animal",
        attributes: [{
            name: "id",
            type: AttributeTypes.Integer,
            primaryKey: true,
        }, {
            type: AttributeTypes.String,
            name: "name",
        }, {
            type: AttributeTypes.Integer,
            name: "age",
        }, {
            type: AttributeTypes.Float,
            name: "Weight",
        }, {
            type: AttributeTypes.Date,
            name: "birthday",
        }, {
            type: AttributeTypes.Boolean,
            name: "isCat",
        }],
    };
    const models = new Collection([animalModel]);

    const resolveFn = (opts) => {
        if (opts.type === ResolveTypes.Viewer) {
            return {};
        }
        if (opts.type === ResolveTypes.QueryOne && opts.model === "animal") {
            return { id: 15, name: "Rex", age: 2, Weight: 6.5, birthday: new Date(), isCat: false };
        }
    };
    const schema = new Schema(models, resolveFn);
    const graphQLSchema = schema.getGraphQLSchema();
    graphql(graphQLSchema, `query Q1{
        viewer{
            animal(id:15){
                id
                name
                age
                Weight
                birthday
                isCat
            }
        }
    }`).then((response) => {
            console.log(response.data);
            /*{ viewer:
                { animal:
                    { id: 15,
                        name: 'Rex',
                        age: 2,
                        Weight: 6.5,
                        birthday: 'Fri Nov 25 2016 06:04:16 GMT+0700 (ICT)',
                        isCat: false } } }*/
        });


For more examples, look https://github.com/arvitaly/graphql-models/blob/master/spec/Functional-spec.ts

# API

## Suported attribute type

    type AttributeType = "string" | "integer" | "float" | "boolean" | "date" | "model" | "collection";

string -> GraphQLString

integer -> GraphQLInt

float -> GraphQLFloat

boolean -> GraphQLBool

date -> GraphQLString

model -> new GraphQLObjectType(...)

collection -> new GraphQLList(new GraphQLObjectType(...))

## Useful arguments for find

### All types

name: `type`, example `where:{ age: 15 }`

For nullable-attributes

_name_`IsNull`, example `where:{ titleIsNull: true }`

_name_`IsNotNull`

### String

_name_`In`

_name_`NotIn`

_name_`Contains`

_name_`NotContains`

_name_`StartsWith`

_name_`NotStartsWith`

_name_`EndsWith`

_name_`NotEndsWith`

_name_`Like`

_name_`NotLike`

### Integer

_name_`In`

_name_`NotIn`

_name_`GreaterThan`

_name_`LessThan`

_name_`GreaterThanOrEqual`

_name_`LessThanOrEqual`

### Float

_name_`In`

_name_`NotIn`

_name_`GreaterThan`

_name_`LessThan`

_name_`GreaterThanOrEqual`

_name_`LessThanOrEqual`

### Date

_name_`In`

_name_`NotIn`

_name_`GreaterThan`

_name_`LessThan`

_name_`GreaterThanOrEqual`

_name_`LessThanOrEqual`

### Boolean   

### Model, Collection

All for primary-key type

## Schema

### new(models: Collection, resolveFn: ResolveFn)

### getSchema(): GraphQLSchema

Collect queries, mutations and subscriptions, add viewer and return GraphQL-schema.

### getQueries(): Queries

Return array of Query.

#### Query = { name: string; field: GraphQLFieldConfig; }

## Model

# Tests

    npm install
    typings install
    npm test