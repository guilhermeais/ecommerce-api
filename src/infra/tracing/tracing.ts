import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { MongoDBInstrumentation } from '@opentelemetry/instrumentation-mongodb';
import { CompressionAlgorithm } from '@opentelemetry/otlp-exporter-base';
import { NodeSDK } from '@opentelemetry/sdk-node';
import 'dotenv/config';
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);

const serviceName = process.env.APP_NAME;
const otlpTraceExporterUrl = process.env.OTEL_TRACE_EXPORTER_URL;
console.log(
  `Instrumenting the application ${serviceName} with OTLP (TraceExporterUrl: ${otlpTraceExporterUrl} ServiceName: ${serviceName})`,
);

const sdk = new NodeSDK({
  serviceName,
  traceExporter: new OTLPTraceExporter({
    url: otlpTraceExporterUrl,
    compression: CompressionAlgorithm.GZIP,
  }),
  instrumentations: [new HttpInstrumentation(), new MongoDBInstrumentation()],
});

process.on('beforeExit', async () => {
  await sdk.shutdown();
});

export async function initializeTracing() {
  return sdk.start();
}
