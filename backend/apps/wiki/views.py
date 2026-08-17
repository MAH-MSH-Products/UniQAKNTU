from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseForbidden
from django.forms import modelformset_factory
from apps.curriculum.models import Exam
from apps.wiki.models import Question, Answer


@login_required
def exam_bulk_answer_view(request, exam_id):
    """
    View for instructors to submit answers for an entire exam at once.
    
    Authorization: Strictly requires request.user.is_authenticated AND 
                   request.user.is_instructor == True. Returns 403 Forbidden otherwise.
    
    Logic: Receives an exam_id. Fetches all Question objects for that exam.
           Renders a Django modelformset_factory for the Answer model, pre-filtered
           for the current user and the specific questions of that exam.
           Supports file uploads (image and pdf_file) via multipart/form-data.
    """
    # Authorization check - only instructors can access
    if not request.user.is_instructor:
        return HttpResponseForbidden("Only instructors can access this page.")
    
    exam = get_object_or_404(Exam, pk=exam_id)
    questions = Question.objects.filter(exam=exam).order_by('question_number')
    
    # Create a formset factory for Answer model with file upload support
    AnswerFormSet = modelformset_factory(
        Answer,
        fields=['current_body', 'image', 'pdf_file'],
        extra=0,
        can_delete=False
    )
    
    if request.method == 'POST':
        # Filter existing answers for this user and these questions
        existing_answers = Answer.objects.filter(
            question__in=questions,
            author=request.user
        )
        
        # CRITICAL: Pass request.FILES to handle file uploads
        formset = AnswerFormSet(request.POST, request.FILES, queryset=existing_answers)
        
        if formset.is_valid():
            # Save all answers
            instances = formset.save(commit=False)
            for instance in instances:
                instance.author = request.user
                instance.save()
            return redirect('exam_detail', exam_id=exam_id)
    else:
        # Pre-populate with existing answers or empty forms for new ones
        existing_answers = Answer.objects.filter(
            question__in=questions,
            author=request.user
        )
        formset = AnswerFormSet(queryset=existing_answers)
    
    context = {
        'exam': exam,
        'questions': questions,
        'formset': formset,
    }
    return render(request, 'wiki/exam_bulk_answer.html', context)
