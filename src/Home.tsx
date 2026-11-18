export default function Home(){
 return <div className="landing">
  <header className="landing-header">
   <a className="brand" href="/" aria-label="言之首页"><span className="brand-icon" aria-hidden="true">言</span><strong>言之</strong><span className="brand-sub">AI 面试表达教练</span></a>
   <nav aria-label="首页导航"><a className="landing-nav-link" href="#how-it-works">如何练习</a><a className="landing-nav-start" href="/train">进入训练 <span aria-hidden="true">↗</span></a></nav>
  </header>
  <main className="landing-main">
   <section className="landing-hero" aria-labelledby="home-title">
    <div className="landing-hero-copy">
     <p className="landing-kicker"><span/> 你的 AI 面试表达教练</p>
     <h1 id="home-title">让真实经历，<br/><em>成为清楚的优势。</em></h1>
     <p className="landing-description">言之帮你练习自我介绍、项目介绍与专业问答。结合目标岗位，找到回答里最值得优化的一点，用具体反馈、表达框架和关键词，帮助你把自己的经历讲明白。</p>
     <div className="landing-hero-actions"><a className="primary landing-cta" href="/train">开始一次训练 <span aria-hidden="true">→</span></a><a className="landing-text-link" href="#how-it-works">看看怎么练 <span aria-hidden="true">↓</span></a></div>
     <p className="landing-invite">约 5–10 分钟一轮 · 支持语音与文字 · 当前为邀请试用</p>
     <div className="landing-principles"><span>基于真实经历</span><span>聚焦一个重点</span><span>用自己的话重说</span></div>
    </div>
    <div className="landing-demo" aria-label="训练方式示意，非真实诊断结果">
     <div className="landing-demo-orbit" aria-hidden="true"/>
     <div className="landing-demo-top"><span className="landing-mini-logo">言</span><span>一次表达，逐渐清楚</span><span className="landing-demo-label">流程示意</span></div>
     <div className="landing-demo-answer"><span className="landing-demo-caption">01 / 先按自己的方式说</span><p>“我负责知识库项目，<br/>做了需求分析和功能验证。”</p><div className="landing-wave" aria-hidden="true">{[12,22,15,31,42,24,34,18,46,28,37,17,24,12,30,19,10].map((h,i)=><i key={i} style={{height:h}}/>)}</div></div>
     <div className="landing-demo-focus"><span className="landing-demo-caption">02 / 找到一个值得补充的地方</span><p>你提到了功能验证，<br/><strong>哪一个测试发现最能说明你的贡献？</strong></p><span className="landing-demo-spark" aria-hidden="true">✳</span></div>
     <div className="landing-demo-guide"><div><span className="landing-demo-caption">03 / 补充后，整理成表达线索</span><p>测试发现 <span>→</span> 个人行动 <span>→</span> 验证结果</p></div><span className="landing-demo-check" aria-hidden="true">↗</span></div>
     <p className="landing-demo-footnote">示意内容。实际反馈依据你的回答生成。</p>
    </div>
   </section>
   <section className="landing-topics" aria-labelledby="topics-title"><div className="landing-section-heading"><div><p className="eyebrow">YOUR NEXT CONVERSATION</p><h2 id="topics-title">从你最想讲清楚的那段开始。</h2></div><p>同一份真实经历，在不同问题里找到重点。</p></div><div className="landing-topic-grid">
    {[
     ['01','自我介绍','让对方快速理解你与岗位的匹配。','聚焦核心优势，让真实项目证据更突出。'],
     ['02','项目与方案介绍','把你做出的贡献讲具体。','理清目标、个人行动、关键判断与阶段成果。'],
     ['03','专业问题回答','把专业理解讲得有依据。','组织观点、推理和论据，说明适用的条件。']
    ].map(([number,title,lead,description])=><article className="landing-topic" key={title}><span className="landing-topic-number">{number}</span><h3>{title}</h3><p className="landing-topic-lead">{lead}</p><p>{description}</p></article>)}
   </div></section>
   <section className="landing-process" id="how-it-works" aria-labelledby="process-title"><div className="landing-section-heading"><div><p className="eyebrow">A LITTLE PRACTICE, A CLEARER STORY</p><h2 id="process-title">练一遍，看见表达的变化。</h2></div><p>从目标岗位出发，最后回到你自己的表达。</p></div><ol className="landing-process-grid">
    {[
     ['先说一遍','贴上目标岗位，用录音或文字完成首次回答。'],
     ['找到重点','获得具体诊断；有证据缺口时，围绕一个追问补充。'],
     ['整理线索','结合已有内容，提炼简短框架与最多三个关键词。'],
     ['自主重说','用自己的语言再回答，对比重点和证据有哪些改善。']
    ].map(([title,description],i)=><li key={title}><span>{String(i+1).padStart(2,'0')}</span><h3>{title}</h3><p>{description}</p></li>)}
   </ol><p className="landing-process-note">如果只是结构需要调整，可以按建议直接整理表达，无需再补一个案例。</p></section>
   <section className="landing-closing"><span className="landing-closing-symbol" aria-hidden="true">言</span><div><p className="eyebrow">MAKE YOUR EXPERIENCE HEARD</p><h2>下一次面试，<br className="landing-mobile-break"/>从一次清楚的表达开始。</h2><p>保留你的真实经历，把重点留给面试官。</p></div><a className="primary landing-cta" href="/train">开始练习 <span aria-hidden="true">→</span></a></section>
   <div className="landing-boundary">言之帮助改善表达和证据呈现，不预测面试通过率。训练内容会发送至配置的 AI 服务，请移除不必要的个人信息。</div>
  </main>
  <footer className="landing-footer"><a className="brand" href="/"><span className="brand-icon" aria-hidden="true">言</span><strong>言之</strong></a><span>让真实经历，被清楚听见。</span><a href="/train">进入训练 ↗</a></footer>
 </div>;
}
