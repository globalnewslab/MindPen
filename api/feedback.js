export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, answer, subject, level } = req.body;

  try {
    // 문제 생성
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

    // 기본 피드백
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

    // 심화 첨삭
    if (action === 'getDeepFeedback') {
      const system = `당신은 한국 초중등 논술 전문 선생님입니다. 학생의 답안을 깊이 있게 분석하고 심층 첨삭을 제공해주세요.
다음 형식으로 작성해주세요:

✅ 잘한 점
(구체적으로 2-3가지)

📌 문장별 수정 제안
(각 문장의 문제점과 개선된 문장 예시를 함께 제시)

🔄 개선 예시
(핵심 문장 1-2개를 더 나은 표현으로 직접 다시 써주세요)

💡 개념어 & 어휘 심화
(이 글에서 활용할 수 있는 개념어와 고급 어휘 제안)

📝 다음 글쓰기 과제
(이 학생의 약점을 보완할 수 있는 다음 글쓰기 주제 제안)

마지막에 격려의 말로 마무리해주세요.`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 2048,
          system,
          messages: [{ role: 'user', content: `학년: ${level}\n\n학생 답안:\n${answer}` }]
        })
      });

      const data = await response.json();
      if (!data.content || !data.content[0]) {
        return res.status(500).json({ error: '심층 첨삭 생성 실패' });
      }
      return res.status(200).json({ feedback: data.content[0].text });
    }

    return res.status(400).json({ error: '잘못된 요청입니다.' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}
