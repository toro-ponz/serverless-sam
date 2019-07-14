'use strict'

const chai = require("chai");
const expect = chai.expect;
const yaml = require('js-yaml');
const assert = chai.assert;
const path = require('path');
const fs = require('fs');

const serverlessTemplate = yaml.safeLoad(fs.readFileSync(__dirname + path.sep + ".." + path.sep + "serverless.yml"));
const samTemplate = yaml.safeLoad(fs.readFileSync(__dirname + path.sep + ".." + path.sep + "sam.yml"));


describe("Tests for " + __filename, () => {
    it("Imported the DynamoDB table resource", () => {
      expect(samTemplate.Resources.ServerlessRestApiWithDynamodbDevTodosDynamoDbTable).to.not.be.null;
    });

    it("The table name is populated correct", () => {
      expect(samTemplate.Resources.ServerlessRestApiWithDynamodbDevTodosDynamoDbTable.Properties.TableName).to.be.equal("serverless-rest-api-with-dynamodb-dev");
    });

    it("Lambda functions were created correctly", () => {
      expect(samTemplate.Resources.ServerlessRestApiWithDynamodbDevCreate).to.not.be.null;
      expect(samTemplate.Resources.ServerlessRestApiWithDynamodbDevUpdate).to.not.be.null;
      expect(samTemplate.Resources.ServerlessRestApiWithDynamodbDevList).to.not.be.null;
      expect(samTemplate.Resources.ServerlessRestApiWithDynamodbDevGet).to.not.be.null;
      expect(samTemplate.Resources.ServerlessRestApiWithDynamodbDevDelete).to.not.be.null;
    });

    it("Lambda runtime is Node JS", () => {
      let runtime = samTemplate.Resources.ServerlessRestApiWithDynamodbDevCreate.Properties.Runtime;
      assert(runtime.includes('nodejs6') || runtime.includes('nodejs4'), 'Version 4 & 6 of NodeJS');
    });

    it("Lambda execution policy was replicated in each function", () => {
      const createPolicies = samTemplate.Resources.ServerlessRestApiWithDynamodbDevCreate.Properties.Policies;
      expect(createPolicies).to.not.be.null;
      expect(createPolicies.length).to.be.equal(1);
      expect(samTemplate.Resources.ServerlessRestApiWithDynamodbDevUpdate.Properties.Policies).to.deep.equal(createPolicies);
      expect(samTemplate.Resources.ServerlessRestApiWithDynamodbDevList.Properties.Policies).to.deep.equal(createPolicies);
      expect(samTemplate.Resources.ServerlessRestApiWithDynamodbDevGet.Properties.Policies).to.deep.equal(createPolicies);
      expect(samTemplate.Resources.ServerlessRestApiWithDynamodbDevDelete.Properties.Policies).to.deep.equal(createPolicies);
    });

    it("Lambda function has environment variables", () => {
      expect(samTemplate.Resources.ServerlessRestApiWithDynamodbDevGet.Properties.Environment.Variables["DYNAMODB_TABLE"]).to.not.be.null;
      expect(samTemplate.Resources.ServerlessRestApiWithDynamodbDevGet.Properties.Environment.Variables["DYNAMODB_TABLE"]).to.be.equal("serverless-rest-api-with-dynamodb-dev");
    });

    it("Rest API exists", () => {
      expect(samTemplate.Resources.ServerlessRestApiWithDynamodb).to.not.be.null;
    });

    it("Rest API has two paths", () => {
      expect(Object.keys(samTemplate.Resources.ServerlessRestApiWithDynamodb.Properties.DefinitionBody.paths).length).to.be.equal(2);
    });

    const todoPath = samTemplate.Resources.ServerlessRestApiWithDynamodb.Properties.DefinitionBody.paths["/todos"];

    it("/todos path has OPTIONS method for CORS", () => {
      expect(todoPath["options"]).to.not.be.null;
    });

    it("OPTIONS method integration is mock", () => {
      expect(todoPath["options"]["x-amazon-apigateway-integration"].type).to.be.equal("mock")
    })

    const responseParams = todoPath["options"]["x-amazon-apigateway-integration"].responses.default.responseParameters;

    it("OPTIONS 200 response returns correct headers", () => {
      expect(responseParams).to.contain.keys("method.response.header.Access-Control-Allow-Headers");
      expect(responseParams).to.contain.keys("method.response.header.Access-Control-Allow-Methods");
      expect(responseParams).to.contain.keys("method.response.header.Access-Control-Allow-Origin");
    });

    it("OPTIONS 200 response headers are mapped correctly", () => {
      expect(responseParams["method.response.header.Access-Control-Allow-Headers"]).to.be.equal("'Content-Type,X-Amz-Date,Authorization,X-Api-Key'");
      expect(responseParams["method.response.header.Access-Control-Allow-Methods"]).to.be.equal("'options,post,get'");
      expect(responseParams["method.response.header.Access-Control-Allow-Origin"]).to.be.equal("'*'");
    });
});
