function installArgon1MInMainWorld() {
  'use strict';
  const g = globalThis;
  if (g.top !== g.self || g.location.protocol !== 'https:' || !['127.0.0.1', 'localhost'].includes(g.location.hostname)) return;
  if (g.__context1mPatch?.installed) return;
  const schemaKey = g.J?.CascadeConfigSchema?.typeName === 'exa.cortex_pb.CascadeConfig' ? 'J' : 'I';
  const createKey = schemaKey === 'J' ? 'Vb' : 'Wb';
  const schemas = g[schemaKey];
  if (typeof g[createKey] !== 'function' || schemas?.CascadeConfigSchema?.typeName !== 'exa.cortex_pb.CascadeConfig' || !schemas?.CheckpointConfigSchema) return;
  const gemini = [318,319,320,417,418,419,525,526,527,528];
  const claude = [400,401,402,403,404,405];
  const ids = [...gemini,...claude];
  if (!g.E?.Model || ids.some(id => g.E.Model['PLACEHOLDER_M'+id] !== id+1000)) return;
  const create = g[createKey];
  const budgets = new Map();
  for (const id of gemini) { budgets.set(id+1000,983040); budgets.set('MODEL_PLACEHOLDER_M'+id,983040); }
  for (const id of claude) { budgets.set(id+1000,868928); budgets.set('MODEL_PLACEHOLDER_M'+id,868928); }
  const state = {installed:true,version:'context-1m-v2',geminiBudget:983040,claudeBudget:868928,rewrittenConfigs:0};
  const configure = config => {
    const budget = budgets.get(config?.plannerConfig?.planModel);
    if (!budget) return config;
    const checkpoint = config.checkpointConfig || create(schemas.CheckpointConfigSchema, {});
    checkpoint.maxTokenLimit = budget;
    checkpoint.tokenThreshold = budget;
    checkpoint.contextWindow = '';
    config.checkpointConfig = checkpoint;
    state.rewrittenConfigs++;
    return config;
  };
  function context1mCreate(schema, init) {
    const message = create.apply(this, arguments);
    if (schema?.typeName === 'exa.cortex_pb.CascadeConfig') configure(message);
    else if (schema?.typeName === 'exa.language_server_pb.SendUserCascadeMessageRequest') configure(message.cascadeConfig);
    return message;
  }
  g[createKey] = context1mCreate;
  Object.defineProperty(g, '__context1mPatch', {configurable:false, enumerable:false, get:()=>Object.freeze({...state, installed:g[createKey] === context1mCreate})});
}
