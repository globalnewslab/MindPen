export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, answer, subject, level } = req.body;

  try {
    // 문제 생성
    if (action === 'getQuestion') {
      const questionPrompt = subject === 'essay'
        ? `한국 ${level} 학생을 위한 논술 문제를 하나 출제해주세요.
           형식:
           📝 오늘의 주제: (주제 한 줄)
           
           (배경 설명 2~3문장)
           
           ✍️ 질문: (구체적인 논술 질문)
           
           💡 개념어: (관련 개념어 2~3개, 예: 공동체, 책임, 자율)
           
           ${level === '초등 5~6학년' ? '150~200자' : '300~400자'} 분량으로 작성하세요.`
        : `한국 ${level} 학생을 위한 영어 영작 문제를 하나 출제해주세요.
           형식:
           📝 오늘의 영작 주제: (주제 한 줄)
           
           (간단한 배경 설명 1~2문장, 한국어)
           
           ✍️ 영작 과제: (구체적인 영작 지시문, 한국어)
           
           💡 활용 단어: (영어 단어 3개와 뜻)
           
           ${level === '초등 5~6학년' ? '3~5문장' : '5~7문장'} 분량으로 작성하세요.`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          messages: [{ role: 'user', content: questionPrompt }]
        })
      });

      const data = await response.json();
      return res.status(200).json({ question: data.content[0].text });
    }

    // 피드백 생성
    if (action === 'getFeedback') {
      const systemPrompt = subject === 'essay'
        ? `당신은 한국 초중등 논술 전문 선생님입니다. 학생의 답안을 읽고 친절하고 구체적인 피드백을 한국어로 제공해주세요.
           피드백 형식:
           ✅ 잘한 점 (1-2가지)
           📌 보완할 점 (1-2가지)
           💡 개념어 활용 제안
           마지막에 격려의 말로 마무리해주세요.`
        : `당신은 한국 초중등 영어 전문 선생님입니다. 학생의 영작문을 읽고 친절하고 구체적인 피드백을 한국어로 제공해주세요.
           피드백 형식:
           ✅ 잘한 점 (1-2가지)
           📌 문법/표현 교정
           💡 더 좋은 표현 제안
           마지막에 격려의 말로 마무리해주세요.`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{ role: 'user', content: `학년/레벨: ${level}\n\n학생 답안:\n${answer}` }]
        })
      });

      const data = await response.json();
      return res.status(200).json({ feedback: data.content[0].text });
    }

  } catch (error) {
    res.status(500).json({ error: '오류가 발생했습니다. 다시 시도해주세요.' });
  }
}
