import fs from 'node:fs/promises';
import {diagnosisSchema,comparisonSchema,diagnosisInputSchema,comparisonInputSchema} from '../server/contracts.mjs';
for(const [name,schema] of Object.entries({'diagnosis':diagnosisSchema,'comparison':comparisonSchema,'diagnosis-input':diagnosisInputSchema,'comparison-input':comparisonInputSchema}))await fs.writeFile(`schemas/${name}.schema.json`,JSON.stringify({$schema:'http://json-schema.org/draft-07/schema#',...schema},null,2)+'\n');
