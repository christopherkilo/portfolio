#!/usr/bin/env node
import * as cdk from "aws-cdk-lib/core";
import { EventHorizonDevStack } from "../lib/event-horizon-dev-stack";
import { NovaTechDevStack } from "../lib/novatech-dev-stack";
import { getCdkEnv } from "../lib/config";

const app = new cdk.App();
const env = getCdkEnv();

new EventHorizonDevStack(app, "EventHorizonDevStack", { env });
new NovaTechDevStack(app, "NovaTechDevStack", { env });
