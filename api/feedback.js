export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { answer, subject, level } = req.body;

  const systemPrompt = subject === 'essay' 
    ? `당신은 한국 초중등 논술 전문 선생님입니다. 학생의 답안을 읽고 친절하고 구체적인 피드백을 한국어로 제공해주세요. 
    피드백 형식:
    ✅ 잘한 점 (1-2가지)
    📌 보완할 점 (1-2가지)  
    💡 오늘의 개념어 활용 제안
    격려하는 말로 마무리해주세요.`
    : `당신은 한국 초중등 영어 전문 선생님입니다. 학생의 영작문을 읽고 친절하고 구체적인 피드백을 한국어로 제공해주세요.
    피드백 형식:
    ✅ 잘한 점 (1-2가지)
    📌 문법/표현 교정 (있다면)
    💡 더 좋은 표현 제안
    격려하는 말로 마무리해주세요.`;

  try {
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
        messages: [
          { role: 'user', content: `학년/레벨: ${level}\n\n학생 답안:\n${answer}` }
        ]
      })
    });

    const data = await response.json();
    const feedback = data.content[0].text;
    res.status(200).json({ feedback });
  } catch (error) {
    res.status(500).json({ error: '피드백 생성 중 오류가 발생했습니다.' });
  }
}
