const fs = require('fs');

const path = './src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

// First, fix LandingView (again).
// The issue is that LandingView's end gets corrupted.
// We know LandingView has: step: "03", icon: FileText, title: "Nhận Kết Quả",
const step3Start = content.indexOf('step: "03", \n                  icon: FileText, \n                  title: "Nhận Kết Quả",');
if (step3Start !== -1) {
  // Let's find where FAQ starts
  const faqStart = content.indexOf('{/* NEW SECTION: FAQ (Accordion) */}', step3Start);
  if (faqStart !== -1) {
    const replacement = `                  desc: "Khám phá 12 cung mệnh, vận hạn năm và lời khuyên phong thủy.",
                  color: "text-pink-600",
                  bg: "bg-pink-50",
                },
                { 
                  step: "04", 
                  icon: MessageSquare, 
                  title: "Tư Vấn Chuyên Sâu", 
                  desc: "Chat trực tiếp với AI để giải đáp mọi thắc mắc về lá số cá nhân.",
                  color: "text-primary",
                  bg: "bg-blue-50",
                }
              ].map((item, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                  className="flex flex-col items-center text-center group"
                >
                  <div className="relative mb-6">
                    <div className={cn(
                      "relative z-10 w-[84px] h-[84px] rounded-[24px] flex items-center justify-center transition-all duration-500 group-hover:scale-105 shadow-md bg-white border border-slate-50", 
                      item.color
                    )}>
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", item.bg)}>
                        <item.icon className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 px-2">
                    <h4 className={cn("text-[15px] font-black uppercase tracking-tight", item.color)}>{item.title}</h4>
                    <p className="text-[12px] text-slate-500 leading-relaxed font-medium">{item.desc}</p>
                  </div>
                  
                  {idx < 3 && (
                    <div className="md:hidden w-[1px] h-8 border-l border-dashed border-slate-200 my-4 mx-auto" />
                  )}
                </motion.div>
              ))}
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="mt-16 text-center"
            >
               <Button 
                 onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                 className="bg-primary hover:bg-primary-hover text-white rounded-[20px] px-10 py-6 text-lg font-black uppercase tracking-[0.05em] shadow-[0_15px_35px_rgba(16,185,129,0.25)] hover:translate-y-[-4px] active:translate-y-[0px] transition-all"
               >
                 BẮT ĐẦU NGAY <ArrowRight className="w-5 h-5 ml-2" />
               </Button>
            </motion.div>
          </div>
        </div>
      </section>

      `;
    
    // We will slice from step3Start + len that string to replace everything between step 3 start string and FAQ
    const searchStr = 'step: "03", \n                  icon: FileText, \n                  title: "Nhận Kết Quả", \n';
    const startIdx = step3Start + searchStr.length;
    
    content = content.slice(0, startIdx) + replacement + content.slice(faqStart);
    console.log("Fixed LandingView");
  }
}

// Next, fix ResultView
const resultViewStart = content.indexOf('function ResultView({');
if (resultViewStart !== -1) {
  const resultViewContent = content.slice(resultViewStart);
  let updatedResultView = resultViewContent.replace(
    /const navTabs \= \['Lá số', 'Đại vận', 'Hạn năm', 'Hạn tháng', 'Chuyên đề'\];/g,
    "const navTabs = ['Lá số', 'Đại vận'];"
  );
  
  updatedResultView = updatedResultView.replace(
    /className="hidden md:flex items-center gap-2 pr-1"/g,
    'className="flex items-center gap-1.5 md:gap-2 shrink-0 pb-1 pr-1"'
  );
  
  // Also we want to ensure the buttons in that container look great
  updatedResultView = updatedResultView.replace(
    /className="bg-primary\/5 border border-primary\/20 text-primary hover:bg-primary hover:text-white text-\[10px\] font-black uppercase tracking-widest shadow-sm rounded-lg h-7 px-3 flex items-center gap-2"/g,
    'className="bg-[#F0FDF4] border border-primary/20 text-primary hover:bg-primary/10 text-[11px] md:text-[12px] font-bold shadow-sm rounded-xl h-7 md:h-8 px-2.5 md:px-3 flex items-center gap-1.5"'
  );

  updatedResultView = updatedResultView.replace(
    /className="w-3 h-3"/g,
    'className="w-3.5 h-3.5"'
  );

  content = content.slice(0, resultViewStart) + updatedResultView;
  console.log("Fixed ResultView");
}

fs.writeFileSync(path, content, 'utf8');
console.log("Done");
