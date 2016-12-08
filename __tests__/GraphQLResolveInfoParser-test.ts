import {
    DocumentNode, FragmentDefinitionNode,
    GraphQLResolveInfo, GraphQLSchema, OperationDefinitionNode, parse,
} from "graphql";
import GraphQLResolveInfoParser from "./../GraphQLResolveInfoParser";
fdescribe("GraphQLResolveInfoParser", () => {
    it("parse all fields", () => {
        const parser = new GraphQLResolveInfoParser(getInfo(`query Q1{ 
        node{ 
            model1{ field1 }
            model2{
                ... on Model2{
                    field2
                } 
            }
        } 
    }`));
        expect(parser.getFields()).toMatchSnapshot();
    });
    it("get node fields", () => {
        const parser = new GraphQLResolveInfoParser(getInfo(`query Q1{ node{ model1{ field1 } } }`));
        expect(parser.getNodeFields()).toMatchSnapshot();
    });
    it("get query one fields", () => {
        const parser = new GraphQLResolveInfoParser(getInfo(`query Q1{ viewer{ model1{ field1, model2{ field2 } }} }`));
        expect(parser.getQueryOneFields()).toMatchSnapshot();
    });
    it("get query connection fields simple", () => {
        const parser = new GraphQLResolveInfoParser(getInfo(`query Q1{
            viewer{
                modelName1s{
                    edges{
                        node{
                            name
                        }
                    }
                    
                }
            }
        }`));
        expect(parser.getQueryConnectionFields()).toMatchSnapshot();
    });
    it("get query connection fields with fragments", () => {
        const parser = new GraphQLResolveInfoParser(getInfo(`query Q1{
            viewer{
                model1(first:10){
                    pageInfo{
                        hasNextPage
                    }
                    ...F1
                }}
            }
            fragment F1 on Model1Connection{
                 edges{
                     node{
                         ...F2
                     }
                 }
            }
            fragment F2 on Model1{
                model1{
                    field1
                    model2{
                        field2
                    }
                }
            }
            `));
        expect(parser.getQueryConnectionFields()).toMatchSnapshot();
    });
});
function getInfo(query: string): GraphQLResolveInfo {
    const document = parse(query);
    let fragments: { [fragmentName: string]: FragmentDefinitionNode } = {};
    document.definitions.filter((definition) => {
        return definition.kind === "FragmentDefinition";
    }).map((node: FragmentDefinitionNode) => {
        fragments[node.name.value] = node;
    });
    const operation = document
        .definitions.find((node) => node.kind === "OperationDefinition") as OperationDefinitionNode;
    return {
        fieldNodes: operation.selectionSet.selections,
        operation,
        fragments,
    } as any;
}
