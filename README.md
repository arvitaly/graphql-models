# graphql-models
Util for generate GraphQL-types from abstract models.

[![Build Status](https://travis-ci.org/arvitaly/graphql-models.svg?branch=master)](https://travis-ci.org/arvitaly/graphql-models)
[![npm version](https://badge.fury.io/js/graphql-models.svg)](https://badge.fury.io/js/graphql-models)
[![Coverage Status](https://coveralls.io/repos/github/arvitaly/graphql-models/badge.svg?branch=master)](https://coveralls.io/github/arvitaly/graphql-models?branch=master)
[![experimental](http://badges.github.io/stability-badges/dist/experimental.svg)](http://github.com/badges/stability-badges)

# Install

    npm install graphql-models --save

# Usage

    import generate, {AttributeTypes} from "graphql-models";
    
    const model1 = {
        id: "model1",
        name: "Model1",
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

    generate([model1, model2]);

# API

## Suported types

    type AttributeType = "string" | "integer" | "float" | "boolean" | "date" | "model" | "collection";

string -> GraphQLString

integer -> GraphQLInt

float -> GraphQLFloat

boolean -> GraphQLBool

date -> GraphQLString

model -> new GraphQLObjectType(...)

collection -> new GraphQLList(new GraphQLObjectType(...))

# Tests

    npm install
    typings install
    npm test