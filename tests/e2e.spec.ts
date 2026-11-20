import {test,expect} from '@playwright/test';
const first='我协调知识库接入。';
const diagnosis={status:'needs_retry',heard:'你协调了知识库接入。',capability_focus:'个人贡献',evidence_assessment:{level:'partial',reason:'已说明职责，尚未展开行动。'},issue_impact:'具体行动才能支持贡献判断。',main_issue:'还不清楚你亲自推动了什么。',evidence_quote:'协调知识库接入',guiding_question:'你亲自解决过什么接入问题？',retry_hints:['个人行动','具体结果']};
async function supplementAndGuide(page:any){
 await expect(page.getByRole('heading',{name:'补充真实信息'})).toBeVisible();
 await expect(page.getByRole('heading',{name:'表达框架',exact:true})).toHaveCount(0);
 await page.route('**/api/guidance',async(r:any)=>{const data=r.request().postDataJSON();expect(data.second_answer).toBeUndefined();expect(data.supplement).toBe('我补齐了权限字段，测试账号验证通过。');return r.fulfill({json:{framework:['原项目目标','个人行动：补齐权限字段','验证结果'],keywords:['知识库','权限字段','验证'],reminder:'结合原题，用自己的语言讲清楚。',supporting_quotes:[{source:'supplement',quote:data.supplement}]}});});
 await page.getByLabel('补充内容').fill('我补齐了权限字段，测试账号验证通过。');
 await page.getByRole('button',{name:'提炼框架和关键词'}).click();
 await expect(page.getByRole('heading',{name:'表达框架',exact:true})).toBeVisible();
 await expect(page.getByRole('heading',{name:'关键词',exact:true})).toBeVisible();
 await expect(page.getByText('结合原题，用自己的语言讲清楚。')).toBeVisible();
 await page.screenshot({path:'test-results/'+test.info().project.name+'-guidance.png',fullPage:true});
}
async function prepare(page:any){await page.goto('/train');await page.getByLabel('岗位描述 JD').fill('AI 产品经理，负责需求分析与效果验证。');await page.getByRole('button',{name:'开始训练'}).click();}
test('Mock UI only: complete text coaching loop and clear local draft',async({page})=>{const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/api/health',r=>r.fulfill({json:{ok:true,llm_configured:true,asr_configured:false}}));await page.route('**/api/diagnose',r=>r.fulfill({json:diagnosis}));await page.route('**/api/compare',r=>{expect(r.request().postDataJSON().guiding_question).toBe(diagnosis.guiding_question);expect(r.request().postDataJSON().supplement).toBeUndefined();expect(r.request().postDataJSON().question).toBe('请介绍一个你负责的项目。');return r.fulfill({json:{status:'improved',clearer_information:['补充了梳理字段的个人行动。'],capability_evidence:{assessment:'more_complete',explanation:'两次回答一起说明了具体贡献。',first_quote:'协调知识库接入',second_quote:'我梳理了字段'},remaining_improvement:null}});});await prepare(page);await page.getByLabel('在这台设备保存文字草稿').check();await page.getByLabel('回答内容').fill(first);await page.getByRole('button',{name:'提交 AI 诊断'}).click();await expect(page.getByText(diagnosis.guiding_question)).toBeVisible();await expect(page.getByText('证据部分充分',{exact:true})).toBeVisible();await expect(page.getByText(diagnosis.issue_impact,{exact:false})).toBeVisible();await page.getByRole('button',{name:'补充这个问题'}).click();await supplementAndGuide(page);await page.getByLabel('回答内容').fill('我梳理了字段，与研发确认后完成接入。');await page.getByRole('button',{name:'查看前后对比'}).click();await expect(page.getByText('表达有了新的进展')).toBeVisible();await expect(page.getByText('补充了梳理字段的个人行动。')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();await page.screenshot({path:`test-results/${test.info().project.name}-comparison.png`,fullPage:true});await page.getByRole('button',{name:'结束并清除'}).click();await expect(page.getByRole('heading',{name:'今天，想练习哪段表达？'})).toBeVisible();expect(await page.evaluate(()=>localStorage.getItem('interview-coach-draft-v1'))).toBeNull();expect(errors).toEqual([]);});
test('real local API: missing key gives honest error and preserves text',async({page})=>{await prepare(page);await page.getByLabel('回答内容').fill(first);await page.getByRole('button',{name:'提交 AI 诊断'}).click();await expect(page.getByRole('alert')).toContainText('LLM_API_KEY');await expect(page.getByLabel('回答内容')).toHaveValue(first);await expect(page.getByRole('button',{name:'提交 AI 诊断'})).toBeEnabled();});
test('JD is required, both questions selectable; no horizontal overflow',async({page})=>{await page.goto('/train');await page.getByRole('button',{name:'开始训练'}).click();await expect(page.getByRole('heading',{name:'今天，想练习哪段表达？'})).toBeVisible();await page.getByRole('radio',{name:/自我介绍/}).check();await page.getByLabel('岗位描述 JD').fill('产品经理职责');await page.getByRole('button',{name:'开始训练'}).click();await expect(page.getByRole('heading',{name:'请做一个自我介绍。'})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();});
test('Mock UI only: clear and insufficient feedback branches',async({page})=>{await page.route('**/api/diagnose',r=>r.fulfill({json:{...diagnosis,status:'clear',evidence_assessment:{level:'sufficient',reason:'已展开行动与验证。'},issue_impact:null,main_issue:null,guiding_question:null,retry_hints:[]}}));await prepare(page);await page.getByLabel('回答内容').fill(first);await page.getByRole('button',{name:'提交 AI 诊断'}).click();await expect(page.getByText('本题关键证据已充分')).toBeVisible();await expect(page.getByText('02 / 最值得补充的证据')).toHaveCount(0);await page.getByRole('button',{name:'修改首次回答'}).click();await page.route('**/api/diagnose',r=>r.fulfill({json:{...diagnosis,status:'insufficient',heard:'还没有听到足够有效的内容。',main_issue:'目前只有语气词。',evidence_quote:null,guiding_question:'能重新介绍一件具体的工作吗？'}}));await page.getByLabel('回答内容').fill('嗯……那个……');await page.getByRole('button',{name:'提交 AI 诊断'}).click();await expect(page.getByRole('button',{name:'补充有效回答'})).toBeVisible();});
test('browser recording stop/re-record, mock ASR editable text; no real ASR acceptance',async({page,context,browserName})=>{test.skip(browserName!=='chromium');await context.grantPermissions(['microphone']);await page.route('**/api/transcribe',r=>r.fulfill({json:{text:'这是测试转录，来自接口 Mock。'}}));await prepare(page);await page.getByRole('button',{name:'开始录音'}).click();await expect(page.getByRole('button',{name:'停止录音'})).toBeVisible();await page.waitForTimeout(1200);await page.getByRole('button',{name:'停止录音'}).click();await expect(page.locator('audio')).toBeVisible();await page.getByRole('button',{name:'转为文字'}).click();await expect(page.getByLabel('回答内容')).toHaveValue('这是测试转录，来自接口 Mock。');await page.getByLabel('回答内容').fill('我修改了转录。');await page.getByRole('button',{name:'重新录制'}).click();await page.getByRole('button',{name:'停止录音'}).click();await expect(page.getByLabel('回答内容')).toHaveValue('我修改了转录。');});
test('real trial access rejects wrong code, accepts correct code and persists within tab',async({page})=>{await page.goto('http://127.0.0.1:3004/train');await page.getByLabel('试用口令').fill('wrong-code');await page.getByRole('button',{name:'进入训练'}).click();await expect(page.getByRole('alert')).toContainText('正确');await page.getByLabel('试用口令').fill('trial-test-code');await page.getByRole('button',{name:'进入训练'}).click();await expect(page.getByLabel('岗位描述 JD')).toBeVisible();await page.reload();await expect(page.getByLabel('岗位描述 JD')).toBeVisible();});
test('Mock transport failure can retry without losing answer',async({page})=>{let count=0;await page.route('**/api/diagnose',r=>++count===1?r.fulfill({status:502,json:{error:{message:'测试服务暂时不可用'}}}):r.fulfill({json:diagnosis}));await prepare(page);await page.getByLabel('回答内容').fill(first);await page.getByRole('button',{name:'提交 AI 诊断'}).click();await expect(page.getByRole('alert')).toContainText('测试服务暂时不可用');await expect(page.getByLabel('回答内容')).toHaveValue(first);await page.getByRole('button',{name:'提交 AI 诊断'}).click();await expect(page.getByText(diagnosis.guiding_question)).toBeVisible();});

for(const [label,description,question] of [
 ['自我介绍','介绍个人背景、核心优势与岗位匹配度。','请做一个自我介绍。'],
 ['项目与方案介绍','介绍项目背景、解决方案、个人贡献与成果。','请介绍一个你负责的项目。'],
 ['专业问题回答','回答岗位相关问题，展示专业理解与逻辑思考。','请回答一个与目标岗位相关的专业问题。']])test('training scene full loop: '+label,async({page})=>{
 await page.goto('/train');await expect(page.getByRole('radio')).toHaveCount(3);
 await page.getByLabel('岗位描述 JD').fill('产品设计与专业分析');
 await page.getByRole('radio',{name:new RegExp(label)}).check();
 await expect(page.getByText(description,{exact:true})).toBeVisible();
 await expect(page.locator('.question-option.selected')).toContainText(label);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.screenshot({path:'test-results/'+test.info().project.name+'-three-scenes-'+label+'.png',fullPage:true});
 await page.route('**/api/diagnose',r=>{expect(r.request().postDataJSON().question).toBe(question);return r.fulfill({json:diagnosis});});
 await page.route('**/api/compare',r=>{expect(r.request().postDataJSON().question).toBe(question);expect(r.request().postDataJSON().guiding_question).toBe(diagnosis.guiding_question);return r.fulfill({json:{status:'improved',clearer_information:['补充了依据'],capability_evidence:{assessment:'more_complete',explanation:'原缺口已解决。',first_quote:'协调知识库接入',second_quote:'补充依据'},remaining_improvement:null}});});
 await page.getByRole('button',{name:'开始训练'}).click();await expect(page.getByRole('heading',{name:question})).toBeVisible();
 await page.getByLabel('回答内容').fill(first);await page.getByRole('button',{name:'提交 AI 诊断'}).click();await expect(page.getByText(diagnosis.guiding_question)).toBeVisible();
 await page.getByRole('button',{name:'补充这个问题'}).click();await supplementAndGuide(page);await page.getByLabel('回答内容').fill('补充依据');await page.getByRole('button',{name:'查看前后对比'}).click();await expect(page.getByText('原缺口已解决。')).toBeVisible();
});
test('removed topic in saved draft falls back to visible project scene',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('interview-coach-draft-v1',JSON.stringify({job_title:'',job_description:'产品岗位',resume:'',question:'请讲一次失败的经历，以及你从中学到了什么。',answer:'保留回答',second_answer:''})));
 await page.goto('/train');await expect(page.getByRole('radio',{name:/项目与方案介绍/})).toBeChecked();await page.getByRole('button',{name:'开始训练'}).click();await expect(page.getByLabel('回答内容')).toHaveValue('保留回答');
});

test('guidance failure preserves supplement; editing supplement invalidates final answer',async({page})=>{
 await page.route('**/api/diagnose',r=>r.fulfill({json:diagnosis}));let calls=0;
 await page.route('**/api/guidance',r=>{calls++;if(calls===1)return r.fulfill({status:502,json:{error:{message:'引导生成暂时失败'}}});const data=r.request().postDataJSON();return r.fulfill({json:{framework:['围绕真实行动组织'],keywords:['权限'],reminder:'自己说一遍。',supporting_quotes:[{source:'supplement',quote:data.supplement}]}});});
 await prepare(page);await page.getByLabel('回答内容').fill(first);await page.getByRole('button',{name:'提交 AI 诊断'}).click();await page.getByRole('button',{name:'补充这个问题'}).click();
 await expect(page.getByRole('button',{name:'提炼框架和关键词'})).toBeDisabled();
 await page.getByLabel('补充内容').fill('我补齐字段。');await page.getByRole('button',{name:'提炼框架和关键词'}).click();await expect(page.getByRole('alert')).toContainText('引导生成暂时失败');await expect(page.getByLabel('补充内容')).toHaveValue('我补齐字段。');
 await page.getByRole('button',{name:'提炼框架和关键词'}).click();await page.getByLabel('回答内容').fill('这是一段旧的完整重说');
 await page.getByRole('button',{name:'修改补充信息'}).click();await expect(page.getByRole('heading',{name:'表达框架',exact:true})).toHaveCount(0);await expect(page.getByLabel('补充内容')).toHaveValue('我补齐字段。');
 await page.getByLabel('补充内容').fill('我补齐字段并复测。');await page.getByRole('button',{name:'提炼框架和关键词'}).click();await expect(page.getByLabel('回答内容')).toHaveValue('');expect(calls).toBe(3);
});
test('clear answer may voluntarily get guidance without inventing supplemental facts',async({page})=>{
 await page.route('**/api/diagnose',r=>r.fulfill({json:{...diagnosis,status:'clear',main_issue:null,issue_impact:null,guiding_question:null,retry_hints:[],evidence_assessment:{level:'sufficient',reason:'证据充分'}}}));
 await page.route('**/api/guidance',r=>{expect(r.request().postDataJSON().supplement).toBe('');expect(r.request().postDataJSON().guiding_question).toBeNull();return r.fulfill({json:{framework:['已有经历','已有证据'],keywords:['知识库'],reminder:'保留原有事实自主表达。',supporting_quotes:[{source:'answer',quote:first}]}});});
 await prepare(page);await page.getByLabel('回答内容').fill(first);await page.getByRole('button',{name:'提交 AI 诊断'}).click();await page.getByRole('button',{name:'自愿再练一次'}).click();await expect(page.getByRole('button',{name:'提炼框架和关键词'})).toBeEnabled();await page.getByRole('button',{name:'提炼框架和关键词'}).click();await expect(page.getByText('保留原有事实自主表达。')).toBeVisible();await expect(page.getByLabel('回答内容')).toHaveValue('');
});

test('saved supplement survives reload without stale guidance and clears on context edit',async({page})=>{
 await page.route('**/api/diagnose',r=>r.fulfill({json:diagnosis}));await prepare(page);await page.getByLabel('在这台设备保存文字草稿').check();await page.getByLabel('回答内容').fill(first);await page.getByRole('button',{name:'提交 AI 诊断'}).click();await page.getByRole('button',{name:'补充这个问题'}).click();await page.getByLabel('补充内容').fill('这是保存的补充内容');await expect.poll(async()=>page.evaluate(()=>JSON.parse(localStorage.getItem('interview-coach-draft-v1')||'{}').supplement)).toBe('这是保存的补充内容');
 await page.reload();await page.getByRole('button',{name:'开始训练'}).click();await page.getByRole('button',{name:'提交 AI 诊断'}).click();await page.getByRole('button',{name:'补充这个问题'}).click();await expect(page.getByLabel('补充内容')).toHaveValue('这是保存的补充内容');await expect(page.getByRole('heading',{name:'表达框架',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'返回诊断'}).click();await page.getByRole('button',{name:'修改首次回答'}).click();await page.getByLabel('回答内容').fill('这是修改后的首次回答');await page.getByRole('button',{name:'提交 AI 诊断'}).click();await page.getByRole('button',{name:'补充这个问题'}).click();await expect(page.getByLabel('补充内容')).toHaveValue('');
});

test('structure advice skips supplement and supports null-question guidance and comparison',async({page})=>{
 const suggestions=['把知识库相关优势前置','合并重复背景'];
 await page.route('**/api/diagnose',r=>r.fulfill({json:{...diagnosis,guiding_question:null,expression_advice:suggestions,evidence_assessment:{level:'sufficient',reason:'已有证据，只需优化结构。'}}}));
 await page.route('**/api/guidance',r=>{const body=r.request().postDataJSON();expect(body.supplement).toBe('');expect(body.guiding_question).toBeNull();expect(body.expression_advice).toEqual(suggestions);return r.fulfill({json:{framework:['相关优势','真实接入证据'],keywords:['知识库'],reminder:'按建议压缩重复背景，用自己的话重说。',supporting_quotes:[{source:'answer',quote:first}]}});});
 await page.route('**/api/compare',r=>{const b=r.request().postDataJSON();expect(b.guiding_question).toBeNull();expect(b.second_answer).toBe('我先介绍知识库优势，再讲接入工作。');expect(b.supplement).toBeUndefined();expect(b.expression_advice).toBeUndefined();return r.fulfill({json:{status:'improved',clearer_information:['相关优势前置'],capability_evidence:{assessment:'more_complete',explanation:'没有新增经历，表达重点更清楚。',first_quote:first,second_quote:b.second_answer},remaining_improvement:null}});});
 await prepare(page);await page.getByLabel('回答内容').fill(first);await page.getByRole('button',{name:'提交 AI 诊断'}).click();await expect(page.getByText('表达优化建议')).toBeVisible();await expect(page.getByText(suggestions[0],{exact:true})).toBeVisible();await expect(page.getByText('03 / 我想追问你')).toHaveCount(0);
 await page.getByRole('button',{name:'按建议进入重说'}).click();await expect(page.getByRole('heading',{name:'表达框架',exact:true})).toBeVisible();await expect(page.getByLabel('补充内容')).toHaveCount(0);await page.getByLabel('回答内容').fill('我先介绍知识库优势，再讲接入工作。');await page.getByRole('button',{name:'查看前后对比'}).click();await expect(page.getByText('没有新增经历，表达重点更清楚。')).toBeVisible();
});
test('structure advice guidance failure retries without a supplemental answer',async({page})=>{
 await page.route('**/api/diagnose',r=>r.fulfill({json:{...diagnosis,guiding_question:null,expression_advice:['相关优势前置'],evidence_assessment:{level:'sufficient',reason:'证据充分，重点需调整。'}}}));let calls=0;
 await page.route('**/api/guidance',r=>{calls++;expect(r.request().postDataJSON().supplement).toBe('');return calls===1?r.fulfill({status:502,json:{error:{message:'引导暂时失败'}}}):r.fulfill({json:{framework:['相关优势前置'],keywords:['知识库'],reminder:'保留原事实。',supporting_quotes:[{source:'answer',quote:first}]}});});
 await prepare(page);await page.getByLabel('回答内容').fill(first);await page.getByRole('button',{name:'提交 AI 诊断'}).click();await page.getByRole('button',{name:'按建议进入重说'}).click();await expect(page.getByRole('alert')).toContainText('引导暂时失败');await expect(page.getByLabel('补充内容')).toHaveCount(0);await page.getByRole('button',{name:'重新提炼框架和关键词'}).click();await expect(page.getByText('保留原事实。')).toBeVisible();expect(calls).toBe(2);
});

test('public home explains product and leads to existing training',async({page})=>{
 await page.goto('/');await expect(page.getByRole('link',{name:'言之首页',exact:true})).toBeVisible();await expect(page.getByRole('heading',{name:/让真实经历，\s*成为清楚的优势。/})).toBeVisible();
 for(const title of ['自我介绍','项目与方案介绍','专业问题回答'])await expect(page.getByRole('heading',{name:title,exact:true})).toBeVisible();
 await expect(page.getByText('流程示意',{exact:true})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();await page.screenshot({path:'test-results/'+test.info().project.name+'-home.png',fullPage:true});
 await page.getByRole('link',{name:'开始一次训练'}).click();await expect(page).toHaveURL(/\/train$/);await expect(page.getByLabel('岗位描述 JD')).toBeVisible();await page.getByRole('link',{name:'言之首页',exact:true}).click();await expect(page.getByRole('heading',{name:/让真实经历，\s*成为清楚的优势。/})).toBeVisible();
});
test('home is public while training keeps trial-code protection',async({page})=>{
 await page.goto('http://127.0.0.1:3004/');await expect(page.getByRole('heading',{name:/让真实经历，\s*成为清楚的优势。/})).toBeVisible();await expect(page.getByLabel('试用口令')).toHaveCount(0);await page.getByRole('link',{name:'开始一次训练'}).click();await expect(page.getByLabel('试用口令')).toBeVisible();await expect(page.getByLabel('岗位描述 JD')).toHaveCount(0);
});

async function accountLogin(page:any,email='one@example.test',password='test-password'){
 await page.getByLabel('邮箱账号').fill(email);await page.getByLabel('密码',{exact:true}).fill(password);await page.getByRole('button',{name:'登录并进入训练'}).click();
}
test('account login: homepage public, wrong password rejected, cookie reload and logout protected',async({page,context})=>{
 await page.goto('http://127.0.0.1:3005/');await page.getByRole('link',{name:'开始一次训练'}).click();await expect(page.getByLabel('邮箱账号')).toBeVisible();await expect(page.getByLabel('岗位描述 JD')).toHaveCount(0);expect((await context.cookies()).length).toBe(0);
 await accountLogin(page,'one@example.test','wrong');await expect(page.getByRole('alert')).toContainText('邮箱或密码不正确');await expect(page.getByLabel('岗位描述 JD')).toHaveCount(0);
 await accountLogin(page);await expect(page.getByLabel('岗位描述 JD')).toBeVisible();await expect(page.getByRole('button',{name:'退出登录'})).toBeVisible();const cookies=await context.cookies();expect(cookies.find(c=>c.name==='coach_session')?.httpOnly).toBeTruthy();expect(cookies.find(c=>c.name==='coach_session')?.sameSite).toBe('Strict');
 await page.getByLabel('岗位描述 JD').fill('这个账号的岗位需求');await page.reload();await expect(page.getByLabel('岗位描述 JD')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.getByRole('button',{name:'退出登录'}).click();await expect(page.getByLabel('邮箱账号')).toBeVisible();await page.screenshot({path:'test-results/'+test.info().project.name+'-account-login.png',fullPage:true});expect((await context.cookies()).find(c=>c.name==='coach_session')).toBeUndefined();await page.reload();await expect(page.getByLabel('邮箱账号')).toBeVisible();
});
test('account drafts isolate identities; expiry allows same-account continuation without leaking to next user',async({page,context})=>{
 await page.goto('http://127.0.0.1:3005/train');await accountLogin(page);await page.getByLabel('岗位描述 JD').fill('账号A的私人岗位');await page.getByLabel('在这台设备保存文字草稿').check();await page.getByRole('button',{name:'开始训练'}).click();await page.getByLabel('回答内容').fill('这是账号A未提交的私人回答。');
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('interview-coach-draft-v1:user-a')||'{}').answer)).toBe('这是账号A未提交的私人回答。');
 await context.clearCookies();await page.getByRole('button',{name:'提交 AI 诊断'}).click();await expect(page.getByLabel('邮箱账号')).toBeVisible();await accountLogin(page);await expect(page.getByLabel('回答内容')).toHaveValue('这是账号A未提交的私人回答。');
 await context.clearCookies();await page.getByRole('button',{name:'提交 AI 诊断'}).click();await expect(page.getByLabel('邮箱账号')).toBeVisible();await accountLogin(page,'two@example.test');await expect(page.getByLabel('岗位描述 JD')).toHaveValue('');await expect(page.getByText('这是账号A未提交的私人回答。',{exact:true})).toHaveCount(0);await page.getByRole('button',{name:'退出登录'}).click();await accountLogin(page);await expect(page.getByLabel('岗位描述 JD')).toHaveValue('账号A的私人岗位');await page.getByRole('button',{name:'退出登录'}).click();await expect(page.getByLabel('邮箱账号')).toBeVisible();await expect.poll(()=>page.evaluate(()=>localStorage.getItem('interview-coach-draft-v1:user-a'))).toBeNull();
});
