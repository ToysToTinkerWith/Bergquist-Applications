# Bergquist Applications

Bergquist Applications is about expanding the Algorand Defi Economy. 

In this repository is a "get started" package, designed to make it easy for beginner developers to jump into building web applications on the Algorand blockchain. Using modern web develpment frameworks, we can bypass a lot of the initial struggles web developers go through when trying to build web applications, and at the same time provide an an intuitive environment for developing and deploying smart contracts. In teaching others about blockchain development, and learning from students and crypto minds alike, Bergquist Applications hopes to produce better and better blockchain applications in time to come.

Any prior knowledge of crypto and software development will help in understanding how the flow of the application works, and how the data is being stored and retrieved on the blockchain. Questions or issues about this development pipeline should be brought up in the Discord Server, where users can get responses from me and other users. Hope all goes well and don't hesitate to reach out!

https://discord.gg/76Mrj6WB



## Getting started

There are a few things you'll need to have downloaded on your computer:

Visual Studio Code (Integrated Coding Workspace)
https://code.visualstudio.com/

Node.js (Web Application Packages)
https://nodejs.org/en/

Python (For compiling smart contracts)
https://www.python.org/downloads/

### Running the web app

By the end of this tutorial, you should have a web application application running in a local server.

Download all the files contained in this repo into a folder of your choice. Open that folder in an instance of Visual Studio Code. Click on the Terminal Button at the top of the window and select "New Terminal". In the terminal type "npm install" and click enter.

Let this run, the system is installing the modules in package.json, the services the web app depends on. Don't worry about any warnings that pop up, they shouldn't be an issue. Once that has finished running you should have a node_modules folder and a package-lock.json file in your build.

Now in the terminal run "npm run dev". This should run a local server with the build on it. The web app should be able to be accessed by opening up a web browser and typing "localhost:3000".

If my website popped up then you're all ready to go. The build files are contained in the src folder, and the flow of the web application starts there. Understanding how to build your own applications will come from studying the flow of this application and applying it to your own use cases.

Press CTRL + C if you want to stop the local server so you can type in the terminal again.

