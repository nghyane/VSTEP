import litellm
from litellm import Router
from app.config import settings

litellm.set_verbose = False
litellm.suppress_debug_info = True


def models() -> list[dict]:
    result = [
        {
            "model_name": "grader",
            "litellm_params": {
                "model": settings.llm_model,
                "api_base": settings.llm_api_base,
                "api_key": settings.llm_api_key,
                "timeout": settings.llm_timeout,
            },
        }
    ]
    if settings.llm_fallback_model:
        result.append(
            {
                "model_name": "grader",
                "litellm_params": {
                    "model": settings.llm_fallback_model,
                    "api_key": settings.llm_fallback_api_key,
                    "timeout": settings.llm_timeout,
                },
            }
        )
    return result


router = Router(
    model_list=models(),
    num_retries=settings.llm_retries,
    timeout=settings.llm_timeout,
)
