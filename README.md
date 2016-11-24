# graphql-models
Util for generate GraphQL-types from abstract models.

[![Build Status](https://travis-ci.org/arvitaly/graphql-models.svg?branch=master)](https://travis-ci.org/arvitaly/graphql-models)
[![npm version](https://badge.fury.io/js/graphql-models.svg)](https://badge.fury.io/js/graphql-models)
[![Coverage Status](https://coveralls.io/repos/github/arvitaly/graphql-models/badge.svg?branch=master)](https://coveralls.io/github/arvitaly/graphql-models?branch=master)
[![experimental](http://badges.github.io/stability-badges/dist/experimental.svg)](http://github.com/badges/stability-badges)

# Install

    npm install graphql-models --save

# Usage

    import {AttributeTypes, Collector} from "graphql-models";
    
    const model1 = {
        id: "model1",
        name: "model1",
        attributes: [{
            name: "title",
            type: AttributeTypes.String
        }]
    }
    const model2 = {
        id: "model2",
        attributes:[{
            name: "m1",
            type: AttributeTypes.Model,
            modelId: "model1"
        }]
    }

    const collector = new Collector([model1, model2]);
    collector.getModel("model1").getBaseType(); // GraphQLObjectType

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