import type { Doctor } from '@/lib/types';

// Seed doctors loaded on first launch or Reset Data.
// Grouped by location as provided.
export const SEED_DOCTORS: Doctor[] = [
  // Anand (148)
  ...[
    'Dr. Aa Mansuri', 'Dr. Aastana Mansuri', 'Dr. Alkesh Soni', 'Dr. Alpa Shah', 'Dr. Amit Soni',
    'Dr. Anas Vohra', 'Dr. Anjana Patel', 'Dr. Ankit Thakkar', 'Dr. Ankur Patel', 'Dr. Ankur Vania',
    'Dr. Arpita Pandya', 'Dr. Arun Rao', 'Dr. Ashvin Patel', 'Dr. Bharat Bhatt', 'Dr. Bhaven Shah',
    'Dr. Bhavin Rupera', 'Dr. Bhavin Vaidh', 'Dr. Bhupendra Rajguru', 'Dr. Biren Shah', 'Dr. Chetan Chudasama',
    'Dr. Chetna Vyas', 'Dr. Deepali Patel', 'Dr. Devang Bhavsar', 'Dr. Dharmendra Patel', 'Dr. Dhaval Joshi',
    'Dr. Dhimant Thaker', 'Dr. Dhruvi Parmar', 'Dr. Dilip Trivedi', 'Dr. Dinesh Aahir', 'Dr. Dipen Thakkar',
    'Dr. Divya Parmar', 'Dr. Faisal Vohra', 'Dr. Falguni Amin', 'Dr. G.K. Goswami', 'Dr. Hardik Gupta',
    'Dr. Harish Nagrani', 'Dr. Harish Singhal', 'Dr. Hemant Antani', 'Dr. Hemant Bhatt', 'Dr. Hetalben Patel',
    'Dr. Hiren Patel', 'Dr. Irbaaz Khalifa', 'Dr. Irshad Vohra', 'Dr. J.C. Vaghela', 'Dr. Jagdish Patel',
    'Dr. Javed Vohra', 'Dr. Jayesh Patel', 'Dr. Jayna Brahmbhatt', 'Dr. Jitendra Patel', 'Dr. Kalpesh Aahir',
    'Dr. Kavita Trivedi', 'Dr. Kumaril Amravat', 'Dr. Kumud Macwan', 'Dr. Kunal Amin', 'Dr. Lataben Thesia',
    'Dr. M.S. Pathan', 'Dr. Mafat Bhai Patel', 'Dr. Mahendra Shah', 'Dr. Mahesh Batra', 'Dr. Maitri Patel',
    'Dr. Mannan Mamji', 'Dr. Manoj Ladhawala', 'Dr. Mansi Shah', 'Dr. Mayank Parekh', 'Dr. Meesonal Maru',
    'Dr. Mehul', 'Dr. Mihir Patel', 'Dr. Mihir Shah', 'Dr. Minesh Trivedi', 'Dr. Munaf Vohra',
    'Dr. Murugen Mehta', 'Dr. Nalin Shah', 'Dr. Nalini Rathod', 'Dr. Nasim Hasmani', 'Dr. Nasimben Hasmani',
    'Dr. Nehal Chavda', 'Dr. Nihal Hussain', 'Dr. Niket Patel', 'Dr. Nilesh Trivedi', 'Dr. Nina Shah',
    'Dr. Nipa Modi', 'Dr. Niraj Shah', 'Dr. Niranjana Ben Masrani', 'Dr. Nitin Patel', 'Dr. Pankaj Ben',
    'Dr. Paresh Dave', 'Dr. Paresh Patel', 'Dr. Parimal Salvi', 'Dr. Parth Patel', 'Dr. Pinakin Dave',
    'Dr. Pinal Parmar', 'Dr. Pinki Kataria', 'Dr. Pradip Upadhyay', 'Dr. Pramod Modh', 'Dr. Prastav Panchal',
    'Dr. Pravin Bala', 'Dr. Preetej Macwan', 'Dr. Preeti Ben Patel', 'Dr. Preeti Patel', 'Dr. Priscilla Macwan',
    'Dr. Priti Patel', 'Dr. Pritiben Patel', 'Dr. Priyank Patel', 'Dr. R.C. Parikh', 'Dr. R.L. Chhangani',
    'Dr. R.V. Megha', 'Dr. Ragini Patel', 'Dr. Rajesh Patel', 'Dr. Rajesh Patil', 'Dr. Rajesh Shah',
    'Dr. Rakesh Aahir', 'Dr. Rakhee Patel', 'Dr. Rama Shrivastava', 'Dr. Ravindra Parikh', 'Dr. Ritesh Patel',
    'Dr. Ronak Thesia', 'Dr. Saalim Kadiyawala', 'Dr. Sachin Arora', 'Dr. Sachin Talati', 'Dr. Sahil Vohra',
    'Dr. Salim Panjavari', 'Dr. Samir Vohra', 'Dr. Sana Lilgar', 'Dr. Shamshad Ansari', 'Dr. Sharad Chandra Shah',
    'Dr. Shefali Shah', 'Dr. Shree Jani', 'Dr. Shriya Sharma', 'Dr. Siddharth Thaker', 'Dr. Snehal Adiwala',
    'Dr. Sohel Vohra', 'Dr. Sumaiyya Shaikh', 'Dr. Sunil Vyas', 'Dr. Suryakant Patel', 'Dr. Tahir Patra',
    'Dr. Trushar Parikh', 'Dr. Uma Jaswal', 'Dr. Upendra Patel', 'Dr. Utsav Thakkar', 'Dr. Vijay Bhai Patel',
    'Dr. Vinubhai Jalandhara', 'Dr. Viren Shah', 'Dr. Vivek Doshi', 'Dr. Vivek Sidhapura', 'Dr. Yaseen Niyatar',
    'Dr. Yogesh Gajjar', 'Dr. Yunus Mirza', 'Dr. Yunusbaig Mirza',
  ].map((name, idx) => ({ id: idx + 1, doctorName: name, location: 'Anand' })),

  // Borsad (41)
  ...[
    'Dr. Aarif Malek', 'Dr. Abdul Sattar', 'Dr. Afzal Memon', 'Dr. Alhaaj Vohra', 'Dr. Amul Raaj',
    'Dr. Ashok Vyas', 'Dr. B.B. Singh', 'Dr. Balmukund Desai', 'Dr. Dasrath Patel', 'Dr. Deepali Patel',
    'Dr. Dipen Thakkar', 'Dr. Hiren Patel', 'Dr. Indravadan Patel', 'Dr. Iqbal Tintoiyya', 'Dr. Jatin Shah',
    'Dr. M.N. Malek', 'Dr. Mahendra Padhiyar', 'Dr. Masood Warsi', 'Dr. Mosami Ben Tiwari', 'Dr. Mukesh Bhatt',
    'Dr. Mukesh New Doctor', 'Dr. Nilesh Bhatt', 'Dr. Nishit Shah', 'Dr. P.N. Darji', 'Dr. P.R. Darji',
    'Dr. Pradip Shah', 'Dr. Pradip Vyas', 'Dr. Prashant Patel', 'Dr. Pratik Vyas', 'Dr. Rahul Barot',
    'Dr. Rahul Shah', 'Dr. S H Wali', 'Dr. Tabassum Vohra', 'Dr. Utpal Desai', 'Dr. Vijay C. Patel',
    'Dr. Vijay Patel', 'Dr. Vijay R. Patel', 'Dr. Vipul Patel', 'Dr. Vipul Shah', 'Dr. Virendra Mahida',
    'Dr. Yash Rabari',
  ].map((name, idx) => ({ id: 200 + idx + 1, doctorName: name, location: 'Borsad' })),

  // Chaklasi-Bhalej (21)
  ...[
    'Dr. Alpesh Aahir', 'Dr. Amit Soni', 'Dr. Anil Gajjar', 'Dr. Ankur Patel', 'Dr. Aruna Shah',
    'Dr. Arvind Megha', 'Dr. Biren Shah', 'Dr. Gk Gosai', 'Dr. Indravadan Amin', 'Dr. Kirit Sutaria',
    'Dr. Mansi Shah', 'Dr. Parth Patel', 'Dr. Pinal Parmar', 'Dr. Prakash Jinjuvadia', 'Dr. Rajesh Patil',
    'Dr. Rajesh Shah', 'Dr. Suryakant Patel', 'Dr. Vandan Vyas', 'Dr. Vijay Thakor', 'Dr. Vinod Bhai Patel',
    'Dr. Vipul Dudhatra',
  ].map((name, idx) => ({ id: 250 + idx + 1, doctorName: name, location: 'Chaklasi-Bhalej' })),

  // Kathlal-Kapadvanj (63)
  ...[
    'Dr. Aakash Shah', 'Dr. Aayush Patel', 'Dr. Abdullah Memon', 'Dr. Ajit Pandya', 'Dr. Alpesh Aahir',
    'Dr. Alpesh Patel', 'Dr. Ambalal Patel', 'Dr. Anuj Prajapati', 'Dr. Anwar Vohra', 'Dr. Arvind Patel',
    'Dr. Arvind Zala', 'Dr. Ashok Patel', 'Dr. Bharat Patel', 'Dr. Bhaven Shah', 'Dr. Bhavesh Shah',
    'Dr. Bhavik Patel', 'Dr. Bismilla Khan Pathan', 'Dr. Chandraaz Kella', 'Dr. Girish Talati', 'Dr. Govind Patel',
    'Dr. Harsh Pandya', 'Dr. Harsh Patel', 'Dr. Harshil Patel', 'Dr. Hasit Patel', 'Dr. Hetal Ben Patel',
    'Dr. Hetal Patel', 'Dr. Jafar Khan Pathan', 'Dr. Jatin Patel', 'Dr. Jitendra Sargara', 'Dr. Kartikey Roy',
    'Dr. Keyur Shah', 'Dr. Kiran Patel', 'Dr. Kiran Shah', 'Dr. Kirit Patel', 'Dr. Kruti Chauhan',
    'Dr. Mahendra Modi', 'Dr. Mahesh Kumar Patel', 'Dr. Manish Shah', 'Dr. Mansi Patel', 'Dr. Mehul Desai',
    'Dr. Mukesh Prajapati', 'Dr. Nilesh Patel', 'Dr. Nishist Patel', 'Dr. Nitesh Patel', 'Dr. Parag Shah',
    'Dr. Paresh Parmar', 'Dr. Paresh Patel', 'Dr. Prakash Parikh', 'Dr. Preeti Ben Parekh', 'Dr. Priti Ben Parikh',
    'Dr. Priti Parikh', 'Dr. Pritiben Patel', 'Dr. Rajendra Patel', 'Dr. Rakesh Patel', 'Dr. Ravindra Pandya',
    'Dr. Rupal Gandhi', 'Dr. Satish Pandya', 'Dr. Soham C. Dave', 'Dr. Suresh Patel', 'Dr. Sureshbhai Patel',
    'Dr. Tejal Shah', 'Dr. Varsha Patel', 'Dr. Zafar Khan Pathan',
  ].map((name, idx) => ({ id: 300 + idx + 1, doctorName: name, location: 'Kathlal-Kapadvanj' })),

  // Kheda-Matar (34)
  ...[
    'Dr. Aateka Vohra', 'Dr. Alkesh Patel', 'Dr. Alpesh Patel', 'Dr. Arvind Patel', 'Dr. Dattu Vyas',
    'Dr. Dinesh Anjana', 'Dr. Hadvaidh', 'Dr. Harshad Patel', 'Dr. Harshad Sevak', 'Dr. Hemant Bhatt',
    'Dr. Kalindi Parikh', 'Dr. Laxit Patel', 'Dr. Manthan Patel', 'Dr. Mehul Desai', 'Dr. Naitik Patel',
    'Dr. Narendrakumar Yadav', 'Dr. Pankaj Parikh', 'Dr. Parth Parmar', 'Dr. Parth Patel', 'Dr. Prachi Sabnis',
    'Dr. Pradip Patel', 'Dr. Rajendra Parekh', 'Dr. Rajendra Parikh', 'Dr. Rajendra Parmar', 'Dr. Rajesh Parikh',
    'Dr. Raman Bharvad', 'Dr. Safura Momin', 'Dr. Salim Rajpara', 'Dr. Shailesh Bhanusali', 'Dr. Shailesh Parikh',
    'Dr. Shreyas Parikh', 'Dr. Uzma Qureshi', 'Dr. Yash Cheeranjivi', 'Dr. Yash Gokani',
  ].map((name, idx) => ({ id: 400 + idx + 1, doctorName: name, location: 'Kheda-Matar' })),

  // Nadiad (195)
  ...[
    'Dr. Aaditi Dave', 'Dr. Aalap Mendawala', 'Dr. Aashish Das', 'Dr. Aayush Patel', 'Dr. Abdullah Memon',
    'Dr. Abhay Saarthi', 'Dr. Ajit Pandya', 'Dr. Ajit Sanghvi', 'Dr. Ajit Shangvi', 'Dr. Alpesh Aahir',
    'Dr. Alpesh Patel', 'Dr. Aman Dalal', 'Dr. Ambalal Patel', 'Dr. Amit Jinjuvadia', 'Dr. Amit Mistry',
    'Dr. Amit Soni', 'Dr. Amita Mahida', 'Dr. Amrat Oza', 'Dr. Anil Gajjar', 'Dr. Anil Vanjha',
    'Dr. Ankur Patel', 'Dr. Apurva Majmudar', 'Dr. Archana Parikh', 'Dr. Arvind Zala', 'Dr. Asfak Kadri',
    'Dr. Ashok Patel', 'Dr. Ashok Vyas', 'Dr. Atul Joshi', 'Dr. Azrah Shaikh', 'Dr. B.K. Shah',
    'Dr. Bhaven Shah', 'Dr. Bhavesh Shah', 'Dr. Bhavik Patel', 'Dr. Bhavin Parekh', 'Dr. Bhumita Shah',
    'Dr. Bimal Gandhi', 'Dr. Bimal Shah', 'Dr. Biren Shah', 'Dr. Bismilla Khan Pathan', 'Dr. C.S. Vadhvani',
    'Dr. Chandraaz Kella', 'Dr. Chirag Jasani', 'Dr. Dattatrey Trivedi', 'Dr. Daxesh Bhatt', 'Dr. Deepa Shah',
    'Dr. Dilip Dave', 'Dr. Dilip Parikh', 'Dr. Dipak Karamchandani', 'Dr. Dixita Panchal', 'Dr. Ekta Jadia',
    'Dr. Falgun Shah', 'Dr. Gaurang Muni', 'Dr. Gaurav Pujara', 'Dr. Gayatri Contractor', 'Dr. Girish Shah',
    'Dr. Gk Gosai', 'Dr. Gk Shah', 'Dr. Gopal Chauhan', 'Dr. Hansa Dave', 'Dr. Hari Gurnani',
    'Dr. Harish Nagrani', 'Dr. Harsh Shah', 'Dr. Harshvardhan Jobanputra', 'Dr. Hemangi Jadeja', 'Dr. Hetal Patel',
    'Dr. Hetalben Patel', 'Dr. Hina Shah', 'Dr. Hiren Contractor', 'Dr. I K Alad', 'Dr. I S Pandya',
    'Dr. Imran Khan Pathan', 'Dr. Imran Pathan', 'Dr. Irshad Vohra', 'Dr. J.C. Vaghela', 'Dr. J.K. Limbachiya',
    'Dr. Jagrut Shah Jyotiben Patel', 'Dr. Jaspin', 'Dr. Jatin Patel', 'Dr. Jatin Shah', 'Dr. Jaykumar Shah',
    'Dr. Jyoti Ben Patel', 'Dr. Jyoti Patel', 'Dr. K.G. Patel', 'Dr. Kamlesh Nakhri', 'Dr. Kamlesh Patel',
    'Dr. Kartikey Roy', 'Dr. Ketan Patel', 'Dr. Kiran Patel', 'Dr. Kirit Patel', 'Dr. Kirit Sutaria',
    'Dr. Kishan Patel', 'Dr. Krupal Panchal', 'Dr. Kruti Chauhan', 'Dr. Kumaril Amravat', 'Dr. Kushal Shah',
    'Dr. Laxita Taral', 'Dr. Mahendra Shah', 'Dr. Mahesh Kumar Patel', 'Dr. Manhar Nayak', 'Dr. Manish Shah',
    'Dr. Mansi Shah', 'Dr. Mayank Parekh', 'Dr. Mayur Prajapati', 'Dr. Mayur Shah', 'Dr. Mohabbat Singh',
    'Dr. Moin Mansuri', 'Dr. Mukesh Jinjuvadia', 'Dr. Mukesh Pandya', 'Dr. Mukesh Patel', 'Dr. Mukesh Prajapati',
    'Dr. N.T. Shah', 'Dr. Nadim Ansari', 'Dr. Nafisa Gugarman', 'Dr. Nafisha Gugarman', 'Dr. Nainesh Vaghela',
    'Dr. Naresh Chudasma', 'Dr. Narhariprasad Vyas', 'Dr. Nikunj Rohit', 'Dr. Nirav Dave', 'Dr. Nirmala Vanjha',
    'Dr. Nishal Patel', 'Dr. Nishant Patel', 'Dr. Nishit Patel', 'Dr. Nishit Shah', 'Dr. Nitin Parmar',
    'Dr. P.D. Premjani', 'Dr. P.P. Joshi', 'Dr. Paresh Parmar', 'Dr. Paresh Patel', 'Dr. Parth Patel',
    'Dr. Pinal Parmar', 'Dr. Pinal Patel', 'Dr. Pinki Kataria', 'Dr. Prakash Gor', 'Dr. Prakash Jinjuvadia',
    'Dr. Prakash Parikh', 'Dr. Prakash Sanghvi', 'Dr. Prakash Sangvi', 'Dr. Prakash Shangvi', 'Dr. Pramod Modh',
    'Dr. Priyanka Patel', 'Dr. R.J. Shah', 'Dr. Rafik Ghanchi', 'Dr. Rahul Sachdev', 'Dr. Rajan Patel',
    'Dr. Rajendra Parmar', 'Dr. Rajendra Patel', 'Dr. Rajesh Patil', 'Dr. Rajesh Shah', 'Dr. Rajesh Varma',
    'Dr. Rakesh Pagi', 'Dr. Rakesh Patel', 'Dr. Ranjan Parasar', 'Dr. Ranjanben Parashar', 'Dr. Rashesh Jadia',
    'Dr. Reshma Balol', 'Dr. Riken Shah', 'Dr. Ronak Patel', 'Dr. Rozmina Vohra', 'Dr. Rupal Gandhi',
    'Dr. Rupangi Vyas', 'Dr. S.K. Parikh', 'Dr. S.V. Vasani', 'Dr. Sarju Patel', 'Dr. Sh Wali',
    'Dr. Shailesh Bhanusali', 'Dr. Shailesh Panchal', 'Dr. Shailesh Raval', 'Dr. Shilesh Raval', 'Dr. Shilpi Raval',
    'Dr. Shipi Raval', 'Dr. Shraddha Singh', 'Dr. Simran Babuna', 'Dr. Soham C. Dave', 'Dr. Soham Dave',
    'Dr. Soham Surendra Dave', 'Dr. Stavan Parmar', 'Dr. Sudip Parmar', 'Dr. Suprit Prabhu', 'Dr. Suryakant Patel',
    'Dr. Suryakant Yadav', 'Dr. Tarun Joshi', 'Dr. Tejal Patel', 'Dr. Tejal Thakkar', 'Dr. Ujjval Shah',
    'Dr. Umesh Shah', 'Dr. V.R. Gwalani', 'Dr. Vasim Shaikh', 'Dr. Vasudev Pandya', 'Dr. Vijay Patel',
    'Dr. Vimal Patel', 'Dr. Vipul Patel', 'Dr. Vipul Shah', 'Dr. Vipul Su Shah', 'Dr. Vrunda Jadav',
  ].map((name, idx) => ({ id: 500 + idx + 1, doctorName: name, location: 'Nadiad' })),

  // Petlad (42)
  ...[
    'Dr. Amit Kotadia', 'Dr. Anuj Prajapati', 'Dr. Arifhusen Saiyed', 'Dr. Arvind Kotadia', 'Dr. Aslam Memon',
    'Dr. Bandhani Chowkdi', 'Dr. Bandhani X', 'Dr. Bipin Shah', 'Dr. C.D. Vaghela', 'Dr. Changa',
    'Dr. Gautam Patel', 'Dr. Gk Patel', 'Dr. Harhsal Soni', 'Dr. Hemant A. Patel', 'Dr. Hetal Patel',
    'Dr. Hetalben Patel', 'Dr. Hiral Patel', 'Dr. Irshad Vohra', 'Dr. Jaydeepsinh Raj', 'Dr. Jitendra Vaghela',
    'Dr. M.D. Vaghela', 'Dr. Mayur Patel', 'Dr. Mukesh Bhatt', 'Dr. N. Singh', 'Dr. Nadiad',
    'Dr. Nadim Ansari', 'Dr. Pankaj Joshi', 'Dr. Piyush Patel', 'Dr. Prabhakar Ghadvi', 'Dr. Prakash Shastri',
    'Dr. Pritesh Shah', 'Dr. Rakesh Pagi', 'Dr. Ritesh Chauhan', 'Dr. Ronak Patel', 'Dr. S.N. Kadri',
    'Dr. Sachin Patel', 'Dr. Sy Agvan', 'Dr. Tushar Soni', 'Dr. Urvi Desai Husband', 'Dr. Vijay Patel',
    'Dr. Viral Patel', 'Dr. Vitthal Patel',
  ].map((name, idx) => ({ id: 700 + idx + 1, doctorName: name, location: 'Petlad' })),

  // Pij-Vaso (37)
  ...[
    'Dr. Atul Joshi', 'Dr. Azrah Shaikh', 'Dr. B.K. Shah', 'Dr. Fejal Momin', 'Dr. Gayatri Joshi',
    'Dr. Gk Shah', 'Dr. Hari Gurnani', 'Dr. Harish Shah', 'Dr. Harsh Shah', 'Dr. Hetal Patel',
    'Dr. Irshad Vohra', 'Dr. Jyoti Ben Patel', 'Dr. K.G. Patel', 'Dr. Ketan Patel', 'Dr. Krupal Panchal',
    'Dr. Mukesh Jinjuvadia', 'Dr. Mukesh Pandya', 'Dr. Nafisha Gugarman', 'Dr. Nikunj Rohit', 'Dr. Nishit Shah',
    'Dr. Prakash Gor', 'Dr. Prakash Jinjuvadia', 'Dr. Prakash Sanghvi', 'Dr. Prakash Shangvi', 'Dr. Rajesh Varma',
    'Dr. Rashesh Jadia', 'Dr. Ronak Patel', 'Dr. Rozmina Vohra', 'Dr. Rupangi Vyas', 'Dr. Sarju Patel',
    'Dr. St Mishra', 'Dr. Sumit Pandya', 'Dr. Tarun Joshi', 'Dr. Tejal Patel', 'Dr. Vipul Patel',
    'Dr. Vipul Shah', 'Dr. Vipul Su Shah',
  ].map((name, idx) => ({ id: 750 + idx + 1, doctorName: name, location: 'Pij-Vaso' })),

  // Salun-Dakor-Umreth (68)
  ...[
    'Dr. Alka Ben Pandya', 'Dr. Alpesh Aahir', 'Dr. Ankur Shah', 'Dr. Bhargav Patel', 'Dr. Bhupendra Shah',
    'Dr. Chirag Sheth', 'Dr. Deepak Pandya', 'Dr. Dhaval Patel', 'Dr. Dhirendra Sinh Parmar', 'Dr. Dinesh Aahir',
    'Dr. Dipak Pandya', 'Dr. Dipika Bhagat', 'Dr. Dipikaben Bhagat', 'Dr. Dushyant Patel', 'Dr. Geeta Ben Parmar',
    'Dr. Gira C. Dabhi', 'Dr. Gira Dabhi', 'Dr. Gynac Madam', 'Dr. H.U. Kamle', 'Dr. Harendra Bhatt',
    'Dr. Harendra Pandya', 'Dr. Himadri Shah', 'Dr. Hitendra Pokar', 'Dr. Hitesh Aahir', 'Dr. Hr Bhatt',
    'Dr. Hridanshi Shah', 'Dr. Istiyak Belim', 'Dr. Kaushal Patel', 'Dr. Kaushal Tankaria', 'Dr. Keyul Patel',
    'Dr. Kiran Shah', 'Dr. Kirit Sutaria', 'Dr. Kuntal Prajapati', 'Dr. Madhusudan Bhagat', 'Dr. Mayur',
    'Dr. Mayur B.D. Patel', 'Dr. Mayur Mo', 'Dr. Mayur Patel', 'Dr. Mayur Shah', 'Dr. Mukesh Agarwal',
    'Dr. Mukesh Dobariya', 'Dr. Mustak Vohra', 'Dr. Namrata Patel', 'Dr. Nirav Patel', 'Dr. Nirav Shah',
    'Dr. Pradip Upadhyay', 'Dr. Prithviraj Pal', 'Dr. Priyanka Patel', 'Dr. Punam Wada', 'Dr. R.M. Patel',
    'Dr. R.R. Patel', 'Dr. Rahul Chavda', 'Dr. Rakesh Maliwad', 'Dr. Ramesh Gosai', 'Dr. Ramesh Jinjuvadia',
    'Dr. Riddhi Patel', 'Dr. Samir Shah', 'Dr. Shailesh Patel', 'Dr. Sunil Patel', 'Dr. Suresh Jain',
    'Dr. Tejas Dave', 'Dr. Tejas Jain', 'Dr. Tushar Patel', 'Dr. Tushar Suthar', 'Dr. Vijay Patel',
    'Dr. Vimal Patel', 'Dr. Wada Sir', 'Dr. Yash Seth',
  ].map((name, idx) => ({ id: 800 + idx + 1, doctorName: name, location: 'Salun-Dakor-Umreth' })),

  // Valetva-Changa (14)
  ...[
    'Dr. Hiral Patel', 'Dr. Hiralbhai Patel', 'Dr. Irshad Vohra', 'Dr. Jaydeepsinh Raj', 'Dr. Monika Batra',
    'Dr. Mustak Ahmed', 'Dr. Nadim Ansari', 'Dr. Nadim Na Pappa', 'Dr. Pritesh Shah', 'Dr. Raj Patel',
    'Dr. Rakesh Pagi', 'Dr. Sachin Patel', 'Dr. Sahil Parekh', 'Dr. Sy Agvan',
  ].map((name, idx) => ({ id: 900 + idx + 1, doctorName: name, location: 'Valetva-Changa' })),

  // Vasad-Asodar-Anklav (11)
  ...[
    'Dr. Arpit Shah', 'Dr. Chintan Pipaliya', 'Dr. Jignesh Patel', 'Dr. Kalpesh Aahir', 'Dr. M. Zaid Patel',
    'Dr. Manoj Patel', 'Dr. Mehul Joshi', 'Dr. Pritesh Chavda', 'Dr. Tushar Patel', 'Dr. Vitthal Patel',
    'Dr. Yogesh Patel',
  ].map((name, idx) => ({ id: 950 + idx + 1, doctorName: name, location: 'Vasad-Asodar-Anklav' })),
];
