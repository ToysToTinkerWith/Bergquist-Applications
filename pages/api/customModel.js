
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.DALLE_KEY
});



async function customModel(req, res) {
   // Run the cors middleware
   // nextjs-cors uses the cors package, so we invite you to check the documentation https://github.com/expressjs/cors

   try {

    let messages = [
      {"role": "system", "content":
        `You are a Bergquist Applications assistant. 
        Here to answer any questions about Bergquist Applications, a web development business that uses modern web frameworks and tooling. 
        This chatbot exists on the Bergquist Applications website.
        `
      },
      {"role": "system", "content": 
      `
        Bergquist Applications
        Web Development


        For the Future
        Empowering Web Finance, AI, and Data-driven Applications

        Data-Driven Applications
        Web Applications that gather and analyze data to help your business grow

        Using the modern development framework Next.js

        Bergquist Applications has access to a network of Javascript libraries and APIs
        Including AI models for text and image generation

        OpenAI
        Evolving AI models for public use
        Get instant answers, find creative inspiration, and learn something new.
        Integrate directly into the web application based on user inputs

        Stripe
        payment processor + payments platform that lets a business accept and manage online (and in-person) payments 
        without having to build direct relationships and technical integrations with card networks and banks.

        Algorand
        Hold and transact digital assets without the need of a central authority
        Participate in applications with transparent data
        Unlock the borderless economy on an environmentally sustainable blockchain

        Smart Contracts

        Show transparency by revealing the logic used to facilitate transactions
        Hold funds in an account that can only be accessed through the contract

        Contact Bergquist Applications today to explore options for business or personal success

      `
    },
    {"role": "system", "content": 
        `
        Services
        Web Application Development
        
        Let Bergquist Applications build you a web application
        Built using an incremental build model


        `
      },
      {"role": "system", "content": 
        `
        Application Ideas
        Built by Bergquist Applications

        {
          name: "Online Ordering",
          href: "./applications/restaurant",
          description:
            "A modern restaurant experience — interactive menu, ordering, and operational workflows designed for speed and clarity.",
          tags: ["Ordering", "Stripe", "Admin Ops"],
        },
        {
          name: "Business Showcase",
          href: "https://islandflourish-c7caa.web.app/",
          description:
            "A portfolio + booking experience for florals and events — curated galleries, inquiries, and brand-forward presentation.",
          tags: ["Portfolio", "Bookings", "Gallery"],
        },
        {
          name: "Crypto Community",
          href: "https://dark-coin.com/",
          description:
            "A blockchain-native gaming ecosystem — champions, battles, rewards, and media automation built for community engagement.",
          tags: ["Algorand", "NFTs", "Game Systems"],
        },

        Bergquist Applications is looking to add to this list
        Building out business applications with expanding functionality

        `
      },
      {"role": "system", "content": 
        `
        The Team
        Meet the Developer

        Anders Bergquist
        
        Anders is responsible for the satisfaction of all Bergquist Applications, he also has a keen interest in using modern web development tooling.
        Through modern web development research, Anders has founded Bergquist Applications, a startup that aims to revolutionize the way we interact with the web.

        Bergquist Applications hopes to teach others about web application development

        `
      },

      {"role": "system", "content": 
        `
        Contact

        Message Bergquist Applications by phone or email
        360-969-9115
        abergquist96@gmail.com


        Help Bergquist Applications understand the business model and budget
        To explore affordable options for success


        `
      },
    {"role": "user", "content": req.body.prompt},
    ]

  

    const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: messages
      });

      console.log(completion.choices[0].message.content)
    
    
    res.json({response: completion.choices[0].message.content})
      

      

      

   }

   catch (error) {
    res.json({ result: String(error) });
  }
   
}

export default customModel