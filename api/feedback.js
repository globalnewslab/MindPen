export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, answer, subject, level } = req.body;

  try {
    if (action === 'getQuestion') {
      const prompt = `한국 ${level} 학생을 위한 논술 문제를 하나 출제해주세요.

형식:
📝 오늘의 주제: (주제 한 줄)

(배경 설명 2~3문장)

✍️ 질문: (구체적인 논술 질문)

💡 개념어: (관련 개념어 2~3개)

${level.includes('초등') ? '150~200자' : '300~400자'} 분량으로 작성하세요.`;

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
          messages: [{ role: 'user', content: prompt }]
        })
      });

      const data = await response.json();
      
      if (!data.content || !data.content[0]) {
        return res.status(500).json({ error: '문제 생성 실패' });
      }
      
      return res.status(200).json({ question: data.content[0].text });
    }

    if (action === 'getFeedback') {
      const system = `당신은 한국 초중등 논술 전문 선생님입니다. 학생의 답안을 읽고 친절하고 구체적인 피드백을 한국어로 제공해주세요.
피드백 형식:
✅ 잘한 점 (1-2가지)
📌 보완할 점 (1-2가지)
💡 개념어 활용 제안
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
          system,
          messages: [{ role: 'user', content: `학년: ${level}\n\n학생 답안:\n${answer}` }]
        })
      });

      const data = await response.json();
      
      if (!data.content || !data.content[0]) {
        return res.status(500).json({ error: '피드백 생성 실패' });
      }
      
      return res.status(200).json({ feedback: data.content[0].text });
    }

    return res.status(400).json({ error: '잘못된 요청입니다.' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}
