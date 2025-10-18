import { GoogleGenAI, Type } from "@google/genai";
import { MoralStory } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const getQuoteOfTheDay = async (): Promise<string> => {
  try {
    // The prompt remains in English for consistent quality from the model
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Give me a short, inspiring quote for the day. Make it profound but concise.',
    });
    return response.text;
  } catch (error) {
    console.error("Error fetching quote of the day:", error);
    return "The best way to predict the future is to create it. - Abraham Lincoln";
  }
};

const fallbackStories: { [key: string]: MoralStory } = {
    en: {
        title: "The Two Pots",
        paragraphs: [
            "A tale of two pots, one of brass and one of earthenware, who were carried away by a flood.",
            "The earthenware pot refused the offer of the brass pot to keep close together for support, fearing that the stronger pot would break the weaker one.",
            "The moral is that equals should associate with equals."
        ]
    },
    fr: {
        title: "Les Deux Pots",
        paragraphs: [
            "Un conte de deux pots, l'un en laiton et l'autre en terre cuite, qui furent emportés par une inondation.",
            "Le pot en terre cuite refusa l'offre du pot en laiton de rester proches pour se soutenir, craignant que le pot plus fort ne brise le plus faible.",
            "La morale est que les égaux devraient s'associer avec leurs égaux."
        ]
    },
    ar: {
        title: "الجرّتان",
        paragraphs: [
            "قصة جرتين، إحداهما من النحاس والأخرى من الفخار، جرفهما الفيضان.",
            "رفضت جرة الفخار عرض جرة النحاس بالبقاء معًا للدعم، خوفًا من أن تكسر الجرة الأقوى الجرة الأضعف.",
            "العبرة من القصة هي أن الأنداد يجب أن يجتمعوا مع أندادهم."
        ]
    }
};


export const generateMoralStory = async (lang: string = 'en'): Promise<MoralStory> => {
    try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          // The prompt remains in English for consistent quality from the model
          contents: `Write a short, multicultural moral story suitable for all ages, translated into ${lang}. The story should be timeless and have a clear, positive message. Provide a title and the story content as an array of paragraphs.`,
           config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                paragraphs: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ["title", "paragraphs"]
            }
          }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error generating moral story:", error);
        return fallbackStories[lang] || fallbackStories['en'];
    }
};