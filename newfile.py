import os

def combine_files(output_filename="combined_text.txt"):
    # تحديد المسار الحالي
    root_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(root_dir, output_filename)
    
    # قائمة المجلدات التي نريد تجاهلها (يمكنك إضافة المزيد هنا)
    ignore_dirs = {'.git', '__pycache__', 'node_modules', '.idea', 'venv'}

    print(f"جاري تجميع الملفات في: {root_dir}")
    print(f"سيتم الحفظ في الملف: {output_filename}")

    with open(output_path, 'w', encoding='utf-8') as outfile:
        for dirpath, dirnames, filenames in os.walk(root_dir):
            
            # --- (تعديل مهم) ---
            # نقوم بتعديل قائمة dirnames مباشرة لتخطي المجلدات المطلوب تجاهلها
            # هذا يمنع os.walk من الدخول إلى هذه المجلدات فرعياً
            dirnames[:] = [d for d in dirnames if d not in ignore_dirs]
            # -------------------

            for filename in filenames:
                # تجاهل ملف الإخراج نفسه
                if filename == output_filename:
                    continue
                
                file_path = os.path.join(dirpath, filename)
                
                try:
                    # قراءة المحتوى
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as infile:
                        content = infile.read()
                        
                        relative_path = os.path.relpath(file_path, root_dir)
                        
                        # كتابة البيانات
                        outfile.write(f"{'='*60}\n")
                        outfile.write(f"اسم الملف: {relative_path}\n")
                        outfile.write(f"{'='*60}\n")
                        outfile.write(content)
                        outfile.write("\n\n")
                        
                        print(f"تمت إضافة: {relative_path}")
                        
                except Exception as e:
                    print(f"تخطي الملف (خطأ): {filename}")

    print("\nتمت العملية بنجاح!")

if __name__ == "__main__":
    combine_files()